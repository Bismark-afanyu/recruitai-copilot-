"""Create a user account in Firebase Auth + Firestore."""

import argparse
import json
import sys
from pathlib import Path

# Ensure we can import from app
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.firebase import get_firebase_auth, get_firestore
from app.repositories.organization import create_organization
from app.repositories.user import create_user

ORG_CLAIM = "org_id"
ROLE_CLAIM = "role"


def main():
    parser = argparse.ArgumentParser(description="Create a new user account")
    parser.add_argument("--username", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--org-name", default="")
    parser.add_argument("--role", default="recruiter")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    fb_auth = get_firebase_auth()
    fb_store = get_firestore()

    if not fb_store:
        print("ERROR: Firestore is not available. Check your Firebase configuration.", file=sys.stderr)
        sys.exit(1)

    # Create organization
    org_name = args.org_name or f"{args.username}'s Organization"
    org_id = create_organization(org_name)
    print(f"Created organization: {org_id} ({org_name})", file=sys.stderr)

    # Create Firebase Auth user
    if fb_auth:
        try:
            user = fb_auth.create_user(
                email=args.email,
                password=args.password,
                display_name=args.username,
            )
            fb_auth.set_custom_user_claims(user.uid, {ORG_CLAIM: org_id, ROLE_CLAIM: args.role})
            print(f"Created Firebase Auth user: {user.uid} ({args.email})", file=sys.stderr)
        except Exception as exc:
            print(f"WARNING: Could not create Firebase Auth user: {exc}", file=sys.stderr)
    else:
        print("Firebase Auth unavailable — user created in Firestore only (local JWT fallback).", file=sys.stderr)

    # Store user in Firestore
    user_doc = create_user(args.username, args.email, org_id, args.role)
    print(f"Stored user document: {args.username}", file=sys.stderr)

    result = {"username": args.username, "email": args.email, "org_id": org_id, "role": args.role}
    if args.json:
        print(json.dumps(result))
    else:
        print(f"\nAccount created! Login with:", file=sys.stderr)
        print(f"  Username: {args.username}", file=sys.stderr)
        print(f"  Email:    {args.email}", file=sys.stderr)
        print(f"  Password: {args.password}", file=sys.stderr)
        print(f"  Org ID:   {org_id}", file=sys.stderr)


if __name__ == "__main__":
    main()
