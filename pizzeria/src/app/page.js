"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("*").order("created_at");
      setProducts(data || []);
    };
    fetchProducts();

    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      else return [...prev, { ...product, quantity: 1 }];
    });
  };

  const decreaseQuantity = (id) => {
    setCart((prev) =>
      prev.map((item) => item.id === id ? { ...item, quantity: item.quantity - 1 } : item)
          .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((item) => item.id !== id));

  const placeOrder = async () => {
    if (!user) return alert("Debes iniciar sesión para hacer un pedido");

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Insertar pedido de prueba
    const { data: order } = await supabase
      .from("orders")
      .insert([{ user_id: user.id, total }])
      .select()
      .single();

    await supabase.from("order_items").insert(
      cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }))
    );

    alert("Pedido creado de prueba! 🍕");
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8 font-sans">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-black dark:text-zinc-50">Menú de Pizzería 🍕</h1>
        {user ? (
          <div className="text-black dark:text-zinc-50">
            Conectado como: <span className="font-semibold">{user.email}</span>
          </div>
        ) : (
          <div className="text-red-500 font-semibold">No estás logueado</div>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <div key={product.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-md flex flex-col items-center">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} width={200} height={200} className="rounded-lg"/>
            ) : (
              <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">
                Sin imagen
              </div>
            )}
            <h2 className="mt-4 text-xl font-semibold text-black dark:text-zinc-50">{product.name}</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{product.description}</p>
            <p className="mt-2 text-lg font-bold text-green-600 dark:text-green-400">${product.price.toFixed(2)}</p>
            <button
              onClick={() => addToCart(product)}
              className={`mt-3 px-4 py-2 rounded text-white ${user ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
              disabled={!user}
            >
              Agregar al carrito
            </button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg w-80">
          <h3 className="font-bold mb-2 text-black dark:text-zinc-50">Tu Carrito</h3>
          <ul>
            {cart.map((item) => (
              <li key={item.id} className="flex justify-between items-center text-black dark:text-zinc-50 mb-1">
                <div>{item.name} x {item.quantity}</div>
                <div className="flex gap-2 items-center">
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                  <button onClick={() => decreaseQuantity(item.id)} className="text-yellow-500 font-bold">-</button>
                  <button onClick={() => removeItem(item.id)} className="text-red-500 font-bold">x</button>
                </div>
              </li>
            ))}
          </ul>
          <p className="font-bold mt-2 text-black dark:text-zinc-50">Total: ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</p>
          <button
            onClick={placeOrder}
            className={`mt-3 w-full py-2 rounded text-white ${user ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
            disabled={!user}
          >
            Hacer Pedido de prueba
          </button>
        </div>
      )}
    </div>
  );
}