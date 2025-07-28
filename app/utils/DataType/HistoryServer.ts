import axios from 'axios'
import type { PaymentHistory } from './History'

const url = "/api"

export const fetchHistory = async (loan_id: number): Promise<PaymentHistory[]> => {
    try{
        const res = await axios.get<PaymentHistory[]>(`${url}/payments/history/${loan_id}`)
        return res.data
    }
    catch(err){
        console.error("Failed to fetch payment history: ", err)
        return []
    }
}

export const addPaymentHistory = async (payment: Omit<PaymentHistory, 'payment_id' | 'created_at'>): Promise<PaymentHistory> => {
    try{
        const res = await axios.post<PaymentHistory>(`${url}/payments`, payment)
        return res.data
    }
    catch(err){
        console.error("Failed to add payment history: ", err)
        throw err
    }
}

export const getPaymentHistoryById = async (id: number): Promise<PaymentHistory> => {
    try{
        const res = await axios.get<PaymentHistory>(`${url}/payments/${id}`)
        return res.data
    }
    catch(err){
        console.error("Failed to fetch payment history: ", err)
        throw err
    }
}