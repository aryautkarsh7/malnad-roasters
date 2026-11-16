from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..auth import current_user

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/products")
async def list_products():
    return await db.select("products", {"select": "*", "order": "created_at.asc"})


@router.get("/products/{product_id}")
async def get_product(product_id: UUID):
    rows = await db.select("products", {"id": f"eq.{product_id}", "select": "*"})
    if not rows:
        raise HTTPException(404, "Product not found.")
    return rows[0]


@router.get("/me")
async def me(user: dict = Depends(current_user)):
    return user
