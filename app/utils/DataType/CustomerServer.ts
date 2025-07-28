import axios from 'axios'
import type { Customer, AddCustomer, EditCustomer } from './Customers'

const url = "/api"

export const getCustomers = async (): Promise<Customer[]> => {
    try{
        const res = await axios.get(`${url}/customers`)
        return res.data
    }
    catch(err){
        console.error("Error fetching customers:", err)
        throw err
    }
}

export const getCustomerById = async (id: number): Promise<Customer> => {
    try{
        const res = await axios.get(`${url}/customers/${id}`)
        return res.data
    }
    catch(err){
        console.error("Error fetching customer:", err)
        throw err
    }
}

export const addCustomer = async (data: AddCustomer): Promise<Customer> => {
    try{
        const res = await axios.post(`${url}/customers`, data)
        return res.data
    }
    catch(err){
        console.error("Error adding customer:", err)
        throw err
    }
}

export const updateCustomer = async (id: number, data: EditCustomer): Promise<Customer> => {
    try{
        const res = await axios.put(`${url}/customers/${id}`, data)
        return res.data
    }
    catch(err){
        console.error("Error updating customer:", err)
        throw err
    }
}

export const deleteCustomer = async (id: number): Promise<void> => {
    try{
        await axios.delete(`${url}/customers/${id}`)
    }
    catch(err){
        console.error("Error deleting customer:", err)
        throw err
    }
}