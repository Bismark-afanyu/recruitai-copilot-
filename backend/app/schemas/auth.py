from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenRequest(BaseModel):
    token: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    uid: str
    email: str
    org_id: str = ""
    role: str = ""


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    org_name: str = ""


class ResolveRequest(BaseModel):
    username: str


class UserInfo(BaseModel):
    uid: str
    email: str
    org_id: str = ""
    role: str = ""
