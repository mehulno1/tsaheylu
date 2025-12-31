from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.auth.admin_dependencies import get_club_admin
from app.db.bulk_upload_repo import process_bulk_upload

router = APIRouter(prefix="/admin", tags=["Admin Bulk Upload"])


@router.post("/clubs/{club_id}/bulk-upload")
async def bulk_upload_members(
    club_id: int,
    file: UploadFile = File(...),
    admin_user_id: int = Depends(get_club_admin),
):
    """
    Bulk upload members for a club via CSV file.
    
    CSV format: phone,name,relation,membership_expiry
    - phone: required (10 digits)
    - name: optional (for self: updates user name if null; for dependent: required with relation)
    - relation: optional (required for dependent membership)
    - membership_expiry: optional (YYYY-MM-DD format)
    
    Creates users, dependents, and memberships with status='active'.
    For SELF rows: Updates user name if provided and user.name is null.
    Skips duplicates safely.
    """
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="File must be a CSV file"
        )
    
    # Read file content
    try:
        content = await file.read()
        # Decode with UTF-8, handling BOM if present
        csv_content = content.decode('utf-8-sig')  # utf-8-sig automatically strips BOM
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read file: {str(e)}"
        )
    
    # Process bulk upload
    try:
        result = process_bulk_upload(club_id=club_id, csv_content=csv_content)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process bulk upload: {str(e)}"
        )

