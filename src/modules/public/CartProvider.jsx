"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { CART_KEY, cleanCart, addCartItem } from "./cart.js";
const Context = createContext({
  items: [],
  add: () => {},
  setQuantity: () => {},
  remove: () => {},
  clear: () => {},
  ready: false,
});
export const useCart = () => useContext(Context);
export default function CartProvider({ children }) {
  const itemsRef = useRef([]);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]),
    [ready, setReady] = useState(false);
  itemsRef.current = items;
  function add(id, q) {
    try {
      const next = addCartItem(itemsRef.current, id, q);
      itemsRef.current = next;
      setItems(next);
      setError(null);
      return true;
    } catch (e) {
      setError(e);
      return false;
    }
  }
  useEffect(() => {
    try {
      setItems(cleanCart(JSON.parse(localStorage.getItem(CART_KEY) || "[]")));
    } catch {}
    setReady(true);
    const sync = (e) => {
      if (e.key === CART_KEY) {
        try {
          setItems(cleanCart(JSON.parse(e.newValue || "[]")));
        } catch {}
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(items));
      } catch {}
  }, [items, ready]);
  return (
    <Context.Provider
      value={{
        items,
        ready,
        error,
        add,
        setQuantity: (id, q) =>
          setItems((s) =>
            cleanCart(
              s.map((x) => (x.product === id ? { ...x, quantity: q } : x)),
            ),
          ),
        remove: (id) => setItems((s) => s.filter((x) => x.product !== id)),
        clear: () => setItems([]),
      }}
    >
      {children}
    </Context.Provider>
  );
}
