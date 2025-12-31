import csv
import io
from typing import Optional
from sqlalchemy import text
from app.db.session import engine
from app.db.user_repo import get_user_by_phone, create_user, update_user_name_if_null


def get_dependent_by_name_relation(user_id: int, name: str, relation: str) -> Optional[int]:
    """
    Get dependent ID by user_id, name, and relation.
    Returns None if not found.
    """
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT id FROM dependents
                WHERE user_id = :user_id
                  AND name = :name
                  AND relation = :relation
                LIMIT 1
            """),
            {
                "user_id": user_id,
                "name": name,
                "relation": relation,
            },
        ).fetchone()
        
        if result:
            return result._mapping["id"]
        return None


def create_dependent_safe(user_id: int, name: str, relation: str) -> int:
    """
    Create dependent if it doesn't exist, return existing ID if it does.
    """
    existing = get_dependent_by_name_relation(user_id, name, relation)
    if existing:
        return existing
    
    with engine.begin() as conn:
        result = conn.execute(
            text("""
                INSERT INTO dependents (user_id, name, relation)
                VALUES (:user_id, :name, :relation)
            """),
            {
                "user_id": user_id,
                "name": name,
                "relation": relation,
            },
        )
        return result.lastrowid


def create_membership_safe(user_id: int, club_id: int, dependent_id: Optional[int] = None, expiry_date: Optional[str] = None) -> tuple[bool, Optional[int]]:
    """
    Create membership if it doesn't exist.
    Returns (created: bool, membership_id: Optional[int])
    If membership already exists, returns (False, existing_id)
    """
    with engine.begin() as conn:
        # Check for existing membership
        existing = conn.execute(
            text("""
                SELECT id FROM memberships
                WHERE user_id = :user_id
                  AND club_id = :club_id
                  AND (
                    (:dependent_id IS NULL AND dependent_id IS NULL)
                    OR
                    (:dependent_id IS NOT NULL AND dependent_id = :dependent_id)
                  )
                LIMIT 1
            """),
            {
                "user_id": user_id,
                "club_id": club_id,
                "dependent_id": dependent_id,
            },
        ).fetchone()
        
        if existing:
            return (False, existing._mapping["id"])
        
        # Create new membership with status = 'active'
        result = conn.execute(
            text("""
                INSERT INTO memberships (user_id, club_id, dependent_id, status, expiry_date)
                VALUES (:user_id, :club_id, :dependent_id, 'active', :expiry_date)
            """),
            {
                "user_id": user_id,
                "club_id": club_id,
                "dependent_id": dependent_id,
                "expiry_date": expiry_date,
            },
        )
        return (True, result.lastrowid)


def process_bulk_upload(club_id: int, csv_content: str) -> dict:
    """
    Process CSV bulk upload for club members.
    
    CSV format: phone,name,relation,membership_expiry
    - phone: required (10 digits)
    - name: optional (for self: updates user name if null; for dependent: required with relation)
    - relation: optional (required for dependent membership)
    - membership_expiry: optional (YYYY-MM-DD format)
    
    If name and relation are provided, creates dependent membership.
    Otherwise, creates self membership.
    
    For SELF rows: If name is provided and user.name is null, updates user name.
    For DEPENDENT rows: Creates dependent with name and relation.
    
    All memberships are created with status = 'active'.
    
    Returns summary with created, skipped, and errors.
    """
    created = []
    skipped = []
    errors = []
    
    # Strip UTF-8 BOM if present (defensive - utf-8-sig should have already handled this)
    if csv_content.startswith('\ufeff'):
        csv_content = csv_content[1:]
    
    # Parse CSV with proper handling of quoted fields
    csv_reader = csv.DictReader(io.StringIO(csv_content))
    
    # Get original fieldnames and create normalization mapping
    original_fieldnames = csv_reader.fieldnames
    if not original_fieldnames:
        errors.append({
            "row": 1,
            "phone": "",
            "error": "CSV file has no headers"
        })
        return {
            "success": True,
            "summary": {
                "total_rows": 0,
                "created": 0,
                "skipped": 0,
                "errors": len(errors),
            },
            "created": created,
            "skipped": skipped,
            "errors": errors,
        }
    
    # Create mapping from normalized header to original header
    header_mapping = {}
    for original_header in original_fieldnames:
        # Normalize: strip BOM, trim whitespace, convert to lowercase
        normalized = original_header.lstrip('\ufeff').strip().lower()
        header_mapping[normalized] = original_header
    
    for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 (row 1 is header)
        try:
            # Normalize row keys by mapping through header_mapping
            normalized_row = {}
            for orig_key, value in row.items():
                # Normalize the key the same way we normalized headers
                normalized_key = orig_key.lstrip('\ufeff').strip().lower()
                normalized_row[normalized_key] = value
            
            # Extract values using normalized keys
            phone = normalized_row.get('phone', '').strip() if normalized_row.get('phone') else ''
            name = normalized_row.get('name', '').strip() if normalized_row.get('name') else ''
            relation = normalized_row.get('relation', '').strip() if normalized_row.get('relation') else ''
            membership_expiry = normalized_row.get('membership_expiry', '').strip() if normalized_row.get('membership_expiry') else None
            if membership_expiry == '':
                membership_expiry = None
            
            # Validate phone
            if not phone:
                errors.append({
                    "row": row_num,
                    "phone": phone,
                    "error": "Phone number is required"
                })
                continue
            
            if not phone.isdigit() or len(phone) != 10:
                errors.append({
                    "row": row_num,
                    "phone": phone,
                    "error": "Phone number must be 10 digits"
                })
                continue
            
            # Get or create user
            user = get_user_by_phone(phone)
            if user:
                user_id = user._mapping["id"]
                user_name = user._mapping.get("full_name")
            else:
                # Create new user - set name if provided and this is a SELF row
                if name and not relation:
                    user_id = create_user(phone, name=name)
                    user_name = name
                else:
                    user_id = create_user(phone)
                    user_name = None
            
            # Determine if this is a dependent or self membership
            dependent_id = None
            if name and relation:
                # Create or get dependent
                dependent_id = create_dependent_safe(
                    user_id=user_id,
                    name=name,
                    relation=relation,
                )
            elif name and not relation:
                # SELF row with name: update user name if currently null (for existing users)
                if user_name is None:
                    update_user_name_if_null(user_id, name)
            
            # Create membership (skips if duplicate)
            was_created, membership_id = create_membership_safe(
                user_id=user_id,
                club_id=club_id,
                dependent_id=dependent_id,
                expiry_date=membership_expiry,
            )
            
            if was_created:
                created.append({
                    "row": row_num,
                    "phone": phone,
                    "member": f"{name} ({relation})" if name and relation else "Self",
                    "membership_id": membership_id,
                })
            else:
                skipped.append({
                    "row": row_num,
                    "phone": phone,
                    "member": f"{name} ({relation})" if name and relation else "Self",
                    "membership_id": membership_id,
                    "reason": "Membership already exists",
                })
                
        except Exception as e:
            errors.append({
                "row": row_num,
                "phone": row.get('phone', ''),
                "error": str(e)
            })
    
    return {
        "success": True,
        "summary": {
            "total_rows": len(created) + len(skipped) + len(errors),
            "created": len(created),
            "skipped": len(skipped),
            "errors": len(errors),
        },
        "created": created,
        "skipped": skipped,
        "errors": errors,
    }

