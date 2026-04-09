import React, { useEffect, useState } from 'react'
import BlueButton from '../components/BlueButton';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const RegisterAndLogin = () => {

    const navigate = useNavigate()

    const [registerForm, setRegisterForm] = useState({
        fullname: "",
        email: "",
        password: ""
    })
    const [loginForm, setLoginForm] = useState({
        email: "",
        password: ""
    })
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const {user, loading, handleLogin, handleRegister, handleGetMe} = useAuth()

    useEffect(()=>{
        const init = async ()=>{
            try {
                const response = await handleGetMe()
                if(response?.user){
                    navigate('/shop')
                }
            } catch {
                // no active session
            }
        }
        init()
    }, [])

    async function submitHandlerRegister(e){
        e.preventDefault();
        setError("")
        setSuccess("")

        try {
            const response = await handleRegister(registerForm.fullname, registerForm.email, registerForm.password)
            setSuccess(response.message || "Account created successfully")
            setRegisterForm({ fullname: "", email: "", password: "" })
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed")
        }
    }

    async function submitHandlerLogin(e){
        e.preventDefault();
        setError("")
        setSuccess("")

        try {
            await handleLogin(loginForm.email, loginForm.password)
            navigate("/shop");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed")
        }
    }

    if(loading){
        return (
            <div className='w-full h-screen flex items-center justify-center'>
                <h1 className='text-3xl font-semibold'>Loading...</h1>
            </div>
        )
    }

  return (
        <div className='w-full max-w-6xl mx-auto min-h-screen grid grid-cols-1 md:grid-cols-2 gap-8 px-6 py-6 md:py-0 justify-items-center place-content-center'>
            <div className="register w-full max-w-md rounded-xl p-6">
                <div className='w-full'>
                    <h3 className="text-3xl font-semibold">Welcome to BagShop</h3>
                    <h4 className="text-lg mb-5 text-zinc-600">Create your account</h4>
                    <form onSubmit={submitHandlerRegister}>
                        <input
                            value={registerForm.fullname}
                            onChange={(e)=>setRegisterForm((prev)=>({ ...prev, fullname: e.target.value }))}
                            type="text"
                            placeholder='Full Name'
                            className='bg-zinc-100 block w-full px-3 py-2 rounded-md mb-3'
                            required
                        />
                        <input
                            value={registerForm.email}
                            onChange={(e)=>setRegisterForm((prev)=>({ ...prev, email: e.target.value }))}
                            type="email"
                            placeholder='Email'
                            className='bg-zinc-100 block w-full px-3 py-2 rounded-md mb-3'
                            required
                        />
                        <input
                            value={registerForm.password}
                            onChange={(e)=>setRegisterForm((prev)=>({ ...prev, password: e.target.value }))}
                            type="password"
                            placeholder='Password'
                            className='bg-zinc-100 block w-full px-3 py-2 rounded-md mb-3'
                            required
                        />
                        <BlueButton btnTitle={"Create My Account"}/>
                    </form>
                </div>
            </div>

            <div className="login w-full max-w-md rounded-xl p-6">
                <div className="w-full">
                    <h4 className="text-2xl capitalize mb-5">Login your account</h4>
                    <form onSubmit={submitHandlerLogin}>
                        <input
                            value={loginForm.email}
                            onChange={(e)=>setLoginForm((prev)=>({ ...prev, email: e.target.value }))}
                            className="block bg-zinc-100 w-full px-3 py-2 rounded-md mb-3"
                            type="email"
                            placeholder='Email'
                            required
                        />
                        <input
                            value={loginForm.password}
                            onChange={(e)=>setLoginForm((prev)=>({ ...prev, password: e.target.value }))}
                            className="block bg-zinc-100 w-full px-3 py-2 rounded-md mb-3"
                            type="password"
                            placeholder='Password'
                            required
                        />
                        <BlueButton btnTitle={"Login"}/>
                    </form>
                    {error ? <p className='text-red-600 mt-4 text-sm'>{error}</p> : null}
                    {success ? <p className='text-green-600 mt-4 text-sm'>{success}</p> : null}
                </div>
            </div>
        </div>
  )
}

export default RegisterAndLogin