import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, setFilters } from "../store/productsSlice";
import { bookProduct } from "../store/bookingSlice";
import ProductCard from "../components/ProductCard";
import FilterBar from "../components/FilterBar";

export default function ProductsPage() {
  const dispatch = useDispatch();
  const products = useSelector((s) => s.products.list);
  const filters = useSelector((s) => s.products.filters);
  const booking = useSelector((s) => s.booking);

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  const onFilter = (f) => {
    dispatch(setFilters(f));
  };

  const onBook = (productId) => {
    dispatch(bookProduct({ product_id: productId, quantity: 1 }));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Products</h2>
      <FilterBar onApply={onFilter} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
        }}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onBook={() => onBook(p.id)} />
        ))}
      </div>
      {booking.status === "loading" && <div>Booking...</div>}
      {booking.status === "succeeded" && (
        <div>Booked: {JSON.stringify(booking.result)}</div>
      )}
      {booking.status === "failed" && <div>Error: {booking.error}</div>}
    </div>
  );
}
