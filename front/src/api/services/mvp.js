import axios from 'axios'

const URL = "http://127.0.0.1:8000"

export const uploadFile = async (file, id_sucursal) => {
    try {
        const formData = new FormData()
        formData.append("file", file)
        if (id_sucursal !== undefined && id_sucursal !== null) {
            formData.append("id_sucursal", String(id_sucursal))
        }

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