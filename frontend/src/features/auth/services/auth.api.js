import { http } from '../../../services/http'

export async function login(email, password) {
    const response = await http.post("/users/login",{
        email,
        password
    })

    return response.data
}

export async function register(fullname, email, password) {
    const response = await http.post("/users/register",{
        fullname,
        email,
        password
    })
    return response.data
}

export async function getMe() {
    const response = await http.get("/users/get-me")
    return response.data
}

export async function logout() {
    const response = await http.get("/users/logout")
    return response.data
}

export async function updateProfile(payload) {
    const response = await http.patch('/users/profile', payload)
    return response.data
}