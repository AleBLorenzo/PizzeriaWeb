"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * 🏠 PÁGINA PRINCIPAL — Menú y carrito de la pizzería
 *
 * MEJORAS respecto a la versión original:
 *
 * 1. useCallback en fetchProducts → evita recrear la función en cada render
 * 2. Estado "loading" y "error" → feedback al usuario mientras carga
 * 3. Estado "ordering" → evita doble-click al hacer pedido
 * 4. Confirmación antes de hacer pedido → evita pedidos accidentales
 * 5. Notificación toast en lugar de alert() → alert() bloquea el hilo de JS
 * 6. Carrito con scroll → si hay muchos items no rompe el layout
 * 7. Botón "+" además del "-" → se puede aumentar cantidad desde el carrito
 * 8. Vaciar carrito → botón para empezar de cero
 * 9. Separación en componentes pequeños → más fácil de leer y mantener
 */

// ─────────────────────────────────────────────
// 🧩 COMPONENTE SEPARADO: Tarjeta de producto
// ¿Por qué separarlo? Porque si metes 100 líneas de JSX en un solo return
// se vuelve ilegible. Cada componente tiene UNA responsabilidad.
// ─────────────────────────────────────────────
function ProductCard({ product, onAdd, disabled }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-md flex flex-col items-center transition-transform hover:scale-[1.02]">
      {product.image_url ? (
        <div className="relative w-48 h-48">
          {/* 
            next/image requiere width y height O fill + un contenedor con posición relativa.
            Usamos fill aquí para que la imagen llene el contenedor sin deformarse.
            object-cover recorta la imagen manteniendo proporciones (como background-size: cover en CSS)
          */}
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="rounded-lg object-cover"
          />
        </div>
      ) : (
        <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 text-4xl">
          🍕
        </div>
      )}

      <h2 className="mt-4 text-xl font-semibold text-black dark:text-zinc-50 text-center">
        {product.name}
      </h2>

      {/* 
        El operador && es un short-circuit: si product.description es null/undefined/""
        no renderiza nada. Más limpio que un ternario con null al final.
      */}
      {product.description && (
        <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm text-center line-clamp-2">
          {product.description}
        </p>
      )}

      <p className="mt-2 text-lg font-bold text-green-600 dark:text-green-400">
        ${product.price.toFixed(2)}
      </p>

      <button
        onClick={() => onAdd(product)}
        disabled={disabled}
        className="mt-3 px-4 py-2 rounded text-white font-medium
                   bg-green-600 hover:bg-green-700
                   disabled:bg-gray-400 disabled:cursor-not-allowed
                   transition-colors w-full"
      >
        {disabled ? "Inicia sesión para pedir" : "Agregar al carrito 🛒"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// 🧩 COMPONENTE SEPARADO: Toast de notificación
// Un "toast" es la notificación pequeña que aparece y desaparece sola.
// Es mucho mejor que alert() porque:
//   - No bloquea el hilo de JavaScript
//   - El usuario puede seguir interactuando
//   - Se ve profesional
// ─────────────────────────────────────────────
function Toast({ message, type }) {
  if (!message) return null;
  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  };
  return (
    <div className={`fixed top-4 right-4 ${colors[type] || colors.info} text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in`}>
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────
// 🏠 COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function Home() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);

  // NUEVO: estados para feedback al usuario
  const [loading, setLoading] = useState(true);       // ¿están cargando los productos?
  const [error, setError] = useState(null);           // ¿hubo error al cargar?
  const [ordering, setOrdering] = useState(false);    // ¿se está procesando el pedido?
  const [toast, setToast] = useState({ message: "", type: "info" }); // notificación

  // ─────────────────────────────────────────────
  // 💡 useCallback: memoriza la función entre renders
  //
  // Sin useCallback, cada vez que el componente se re-renderiza
  // (por cualquier cambio de estado), fetchProducts se RECREA como
  // una función nueva. Esto no rompe nada, pero es ineficiente.
  //
  // Con useCallback, la función solo se recrea si cambian sus dependencias
  // (en este caso, ninguna: []).
  // ─────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Desestructuramos tanto "data" como "error" de la respuesta de Supabase
    // Tu versión original ignoraba el error → si fallaba, la app quedaba vacía sin aviso
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at");

    if (error) {
      setError("No se pudieron cargar los productos. Intenta de nuevo.");
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    // Escuchar cambios de sesión en tiempo real
    // Esto es necesario para que el componente reaccione cuando el usuario
    // hace logout desde otra pestaña, por ejemplo
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup: cuando el componente se desmonta, cancelamos la suscripción
    // Sin esto, tendrías un "memory leak" — el listener seguiría activo
    // aunque la página ya no exista
    return () => listener.subscription.unsubscribe();
  }, [fetchProducts]);

  // ─────────────────────────────────────────────
  // 🍞 Función helper para mostrar toasts
  // La guardamos en una función para no repetir la misma lógica
  // showToast("Mensaje", "success") → muestra y desaparece en 3s
  // ─────────────────────────────────────────────
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "info" }), 3000);
  };

  // ─────────────────────────────────────────────
  // 🛒 Lógica del carrito
  // Todas estas funciones son "pure" — solo modifican el estado del carrito
  // usando el patrón funcional de useState: setCart(prev => ...)
  //
  // ¿Por qué prev => ...?
  // React puede batching updates (agrupar actualizaciones). Si usas el estado
  // directamente (setCart([...cart, item])) en vez de la forma funcional
  // (setCart(prev => [...prev, item])), podrías leer un valor desactualizado.
  // La forma funcional garantiza que siempre trabajas con el estado más reciente.
  // ─────────────────────────────────────────────
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`${product.name} añadido al carrito`, "success");
  };

  const increaseQuantity = (id) => {
    setCart((prev) =>
      prev.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
    );
  };

  const decreaseQuantity = (id) => {
    setCart((prev) =>
      prev
        .map((item) => item.id === id ? { ...item, quantity: item.quantity - 1 } : item)
        .filter((item) => item.quantity > 0) // Elimina si llega a 0
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((item) => item.id !== id));

  const clearCart = () => setCart([]);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ─────────────────────────────────────────────
  // 📦 Hacer pedido
  // ─────────────────────────────────────────────
  const placeOrder = async () => {
    if (!user) return showToast("Debes iniciar sesión para hacer un pedido", "error");
    if (cart.length === 0) return;

    // Confirmación antes de proceder — evita pedidos accidentales
    // En una app real usarías un modal, pero confirm() es suficiente para aprender
    const confirmed = window.confirm(
      `¿Confirmar pedido de ${totalItems} item(s) por $${totalPrice.toFixed(2)}?`
    );
    if (!confirmed) return;

    setOrdering(true); // Deshabilita el botón mientras procesa

    try {
      // ─────────────────────────────────────────────
      // 💡 TRANSACCIÓN en dos pasos:
      // 1. Crear el "order" (cabecera del pedido)
      // 2. Crear los "order_items" (líneas del pedido)
      //
      // El problema de hacer esto en dos llamadas separadas es que si la
      // segunda falla, el order queda huérfano en la BD. En producción
      // usarías una función RPC de Supabase o una transacción de PostgreSQL.
      // Para aprender, este enfoque es suficiente.
      // ─────────────────────────────────────────────
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{ user_id: user.id, total: totalPrice }])
        .select()
        .single(); // .single() devuelve el objeto directamente (no un array)

      if (orderError) throw orderError; // Lanzamos el error para ir al catch

      const { error: itemsError } = await supabase.from("order_items").insert(
        cart.map((item) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        }))
      );

      if (itemsError) throw itemsError;

      showToast("¡Pedido realizado con éxito! 🍕", "success");
      clearCart();
    } catch (err) {
      // Si cualquiera de los dos pasos falla, mostramos el error
      console.error("Error al hacer pedido:", err);
      showToast("Error al procesar el pedido. Intenta de nuevo.", "error");
    } finally {
      // finally siempre se ejecuta, haya error o no
      // Así nos aseguramos de que el botón vuelva a habilitarse
      setOrdering(false);
    }
  };

  // ─────────────────────────────────────────────
  // 🎨 RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8 font-sans">
      {/* Toast de notificación */}
      <Toast message={toast.message} type={toast.type} />

      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-black dark:text-zinc-50">
          Menú de Pizzería 🍕
        </h1>
        {user ? (
          <div className="text-black dark:text-zinc-50 text-sm">
            👤 <span className="font-semibold">{user.email}</span>
          </div>
        ) : (
          <a
            href="/auth/login"
            className="text-green-600 font-semibold hover:underline"
          >
            Iniciar sesión →
          </a>
        )}
      </header>

      {/* Estado de carga */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500 text-xl animate-pulse">Cargando menú...</div>
        </div>
      )}

      {/* Estado de error + botón de reintento */}
      {error && !loading && (
        <div className="flex flex-col items-center gap-4 h-64 justify-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchProducts}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Grid de productos */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={addToCart}
              disabled={!user} // Solo se puede agregar si hay sesión
            />
          ))}
        </div>
      )}

      {/* ─── CARRITO ─── */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-2xl w-80 max-h-[70vh] flex flex-col">
          {/* Cabecera del carrito */}
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-black dark:text-zinc-50">
              🛒 Carrito ({totalItems})
            </h3>
            <button
              onClick={clearCart}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Vaciar
            </button>
          </div>

          {/* 
            overflow-y-auto → scroll vertical si hay muchos items
            flex-1 → ocupa el espacio disponible dejando sitio al total y botón
          */}
          <ul className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-700">
            {cart.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center text-black dark:text-zinc-50 py-2"
              >
                <div className="flex-1 text-sm font-medium">{item.name}</div>
                <div className="flex gap-1 items-center ml-2">
                  {/* Controles de cantidad */}
                  <button
                    onClick={() => decreaseQuantity(item.id)}
                    className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 text-center leading-none hover:bg-gray-200"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => increaseQuantity(item.id)}
                    className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 text-center leading-none hover:bg-gray-200"
                  >
                    +
                  </button>
                  <span className="w-14 text-right text-sm text-green-600 font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-400 hover:text-red-600 ml-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Total y botón de pedido */}
          <div className="border-t dark:border-gray-700 pt-3 mt-2">
            <p className="font-bold text-black dark:text-zinc-50 mb-2 flex justify-between">
              <span>Total:</span>
              <span className="text-green-600">${totalPrice.toFixed(2)}</span>
            </p>
            <button
              onClick={placeOrder}
              disabled={!user || ordering}
              className="w-full py-2 rounded text-white font-semibold
                         bg-blue-600 hover:bg-blue-700
                         disabled:bg-gray-400 disabled:cursor-not-allowed
                         transition-colors"
            >
              {ordering ? "Procesando..." : "Hacer Pedido"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}