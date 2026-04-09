import { useContext } from "react"
import { AuthContext } from "../auth.context"
import { login, register, getMe, logout, updateProfile } from "../services/auth.api"


export const useAuth = ()=>{

    const context = useContext(AuthContext)
    const {user, setUser, loading, setLoading } = context

    const handleLogin = async (email, password)=>{
        try {
            setLoading(true)
            const response = await login(email, password)
            setUser(response.user)
            return response
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (fullname, email, password)=>{
        try {
            setLoading(true)
            const response = await register(fullname, email, password)
            return response
        } finally {
            setLoading(false)
        }
    }

    const handleGetMe = async ()=>{
        try {
            setLoading(true)
            const response = await getMe()
            setUser(response.user)
            return response
        } catch (error) {
            setUser(null)
            throw error
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async ()=>{
        const response = await logout()
        setUser(null)
        return response
    }

    const handleUpdateProfile = async (payload)=>{
        try {
            setLoading(true)
            const response = await updateProfile(payload)
            setUser(response.user)
            return response
        } finally {
            setLoading(false)
        }
    }

    return {
        user, loading, handleLogin, handleRegister, handleGetMe, handleLogout, handleUpdateProfile
    }

}