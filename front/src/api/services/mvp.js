import axios from 'axios'

const URL = "http://127.0.0.1:8000"

export const uploadFile = async (file) => {
    try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await axios.post(`${URL}/load`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })

        console.log("✅ Respuesta del servidor:", response.data)
        return response.data
    } catch (error) {
        return error.response
    }
}

export const predict = async () => {
    try {
        const response = await axios.post(`${URL}/predict`)
        console.log("✅ Respuesta del servidor:", response.data)
        return response.data
    } catch (error) {
        return error.response
    }
}