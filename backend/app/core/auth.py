from fastapi import Header, HTTPException


def get_current_user_id(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")

    token = authorization.replace("Bearer ", "")

    if not token.startswith("user-"):
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        user_id = int(token.replace("user-", ""))
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token format")

    return user_id
