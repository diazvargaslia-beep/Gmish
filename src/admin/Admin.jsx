import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import ProductsAdmin from "./ProductsAdmin"

function Admin() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkSession = async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()

    setSession(currentSession)
    setCheckingSession(false)
  }

  const handleLogin = async (event) => {
    event.preventDefault()

    setLoginLoading(true)
    setLoginError("")

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoginError("Correo o contraseña incorrectos.")
      setLoginLoading(false)
      return
    }

    setSession(data.session)
    setLoginLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  useEffect(() => {
    if (!session) {
      return
    }

    testConnection()
  }, [session])

  const testConnection = async () => {
    setLoading(true)
    setError("")

    const { error } = await supabase
      .from("products")
      .select("id")
      .limit(1)

    if (error) {
      setError(error.message)
      setConnected(false)
    } else {
      setConnected(true)
    }

    setLoading(false)
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0F0C] text-white">
        <p className="text-gray-400">
          Comprobando acceso...
        </p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0F0C] px-4 text-white">

        <div className="w-full max-w-md">

          <div className="mb-8 text-center">

            <p className="logo-glitter text-4xl font-black italic tracking-[0.08em]">
              GMISH
            </p>

            <h1 className="mt-6 text-3xl font-black">
              Acceso administrativo
            </h1>

            <p className="mt-2 text-gray-400">
              Inicia sesión para administrar tu tienda.
            </p>

          </div>

          <form
            onSubmit={handleLogin}
            className="rounded-2xl border border-[#302E28] bg-[#151714] p-6 md:p-8"
          >

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Correo
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Tu correo"
                required
                className="w-full rounded-xl border border-[#302E28] bg-[#0D0F0C] px-4 py-3 text-white outline-none focus:border-[#F0D58A]"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold">
                Contraseña
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tu contraseña"
                required
                className="w-full rounded-xl border border-[#302E28] bg-[#0D0F0C] px-4 py-3 text-white outline-none focus:border-[#F0D58A]"
              />
            </div>

            {loginError && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="mt-6 w-full rounded-xl bg-[#F0D58A] px-5 py-3 font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loginLoading
                ? "Iniciando sesión..."
                : "Iniciar sesión"}
            </button>

          </form>

        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0F0C] text-white">

      <div className="border-b border-[#302E28] bg-[#151714]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F0D58A]">
              GMISH
            </p>

            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              Panel de administración
            </h1>

            <p className="mt-2 text-gray-400">
              Centro de control de tu tienda.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-[#302E28] px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-red-400 hover:text-red-300"
          >
            Cerrar sesión
          </button>

        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">

        <div className="mb-6 rounded-2xl border border-[#302E28] bg-[#151714] p-5">

          <div className="flex items-center gap-3">

            <div
              className={`h-3 w-3 rounded-full ${
                loading
                  ? "bg-yellow-400"
                  : connected
                    ? "bg-green-400"
                    : "bg-red-400"
              }`}
            />

            <div>
              <p className="font-semibold">
                {loading
                  ? "Comprobando conexión..."
                  : connected
                    ? "Base de datos conectada"
                    : "Error de conexión"}
              </p>

              <p className="mt-1 text-sm text-gray-400">
                {loading
                  ? "Conectando GMISH con Supabase."
                  : connected
                    ? "GMISH puede comunicarse con la base de datos."
                    : "No se pudo conectar con la tabla de productos."}
              </p>
            </div>

          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

        </div>

        {connected && <ProductsAdmin />}

      </div>

    </div>
  )
}

export default Admin
