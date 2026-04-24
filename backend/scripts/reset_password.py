"""
Usage:
    python scripts/reset_password.py <email> <new_password>

Example:
    python scripts/reset_password.py bakhodirnematjanov@gmail.com MyNewPass1
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

from app.core.logger import setup_logging
from app.core.security import SecurityService
from app.database import Database


async def main(email: str, new_password: str) -> None:
    setup_logging(debug=False)
    await Database.connect()
    db = Database.get()

    user = await db.users.find_one({"email": email})
    if not user:
        print(f"ERROR: No user with email '{email}'")
        print("Users in DB:")
        async for u in db.users.find({}, {"email": 1, "username": 1, "is_verified": 1}):
            print(f"  {u['email']} (verified={u.get('is_verified')})")
        return

    hashed = SecurityService.hash_password(new_password)
    await db.users.update_one(
        {"email": email},
        {"$set": {"password_hash": hashed, "is_verified": True}},
    )
    await db.sessions.delete_many({"user_id": str(user["_id"])})
    print(f"Password reset for {email}")
    print(f"Email marked as verified: True")
    print(f"All active sessions cleared")
    await Database.disconnect()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    asyncio.run(main(sys.argv[1], sys.argv[2]))
