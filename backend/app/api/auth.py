"""Auth endpoints."""
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.auth import LoginRequest, RegisterRequest, ResolveRequest
from app.services import auth as auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(body: LoginRequest):
    return auth_service.login(body.username, body.password)


@router.post("/register")
def register(body: RegisterRequest):
    return auth_service.register(body.username, body.email, body.password, body.org_name)


@router.post("/resolve")
def resolve(body: ResolveRequest):
    return auth_service.resolve_username(body.username)


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return auth_service.get_user_info(user)
