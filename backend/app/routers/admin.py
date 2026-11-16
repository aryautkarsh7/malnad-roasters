from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..auth import admin_user
from ..schemas import ProductIn, StatusIn

router = APIRouter(prefix="/admin", dependencies=[Depends(admin_user)])

STATUSES = ["new", "processing", "shipped", "delivered", "cancelled"]


@router.get("/stats")
async def stats():
    products = await db.select("products", {"select": "stock"})
    orders = await db.select("orders", {"select": "total,status"})

    by_status = {s: 0 for s in STATUSES}
    revenue = 0
    for order in orders:
        by_status[order["status"]] = by_status.get(order["status"], 0) + 1
        if order["status"] != "cancelled":
            revenue += order["total"]

    return {
        "products": len(products),
        "orders": len(orders),
        "revenue": revenue,
        "low_stock": sum(1 for p in products if 0 < p["stock"] <= 5),
        "out_of_stock": sum(1 for p in products if p["stock"] == 0),
        "by_status": by_status,
    }


@router.post("/products", status_code=201)
async def create_product(payload: ProductIn):
    return await db.insert("products", payload.model_dump())


@router.put("/products/{product_id}")
async def update_product(product_id: UUID, payload: ProductIn):
    rows = await db.update(
        "products",
        {"id": f"eq.{product_id}"},
        {**payload.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()},
    )
    if not rows:
        raise HTTPException(404, "Product not found.")
    return rows[0]


@router.delete("/products/{product_id}", status_code=204)
async def delete_product(product_id: UUID):
    rows = await db.delete("products", {"id": f"eq.{product_id}"})
    if not rows:
        raise HTTPException(404, "Product not found.")


@router.get("/orders")
async def list_orders():
    return await db.select(
        "orders",
        {"select": "*,order_items(*),profiles(email)", "order": "created_at.desc"},
    )


@router.patch("/orders/{order_id}/status")
async def set_order_status(order_id: UUID, payload: StatusIn):
    rows = await db.update("orders", {"id": f"eq.{order_id}"}, {"status": payload.status})
    if not rows:
        raise HTTPException(404, "Order not found.")
    return rows[0]
