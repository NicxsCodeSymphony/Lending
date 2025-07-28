import axios from 'axios'
import type { Receipts } from './Receipt'

const url = "/api"

export const fetchReceipt = async ():Promise<Receipts[]> => {
    try{
        const res = await axios.get<Receipts[]>(`${url}/receipts`)
        console.log('🔍 Raw receipts data from API:', res.data);
        return res.data
    }
    catch(err){
        console.error("Failed to fetch receipts: ", err)
        return []
    }
}

export const getReceiptsByLoan = async (loanId: number): Promise<Receipts[]> => {
    try{
        const res = await axios.get<Receipts[]>(`${url}/receipts/loan/${loanId}`)
        return res.data
    }
    catch(err){
        console.error("Failed to fetch loan receipts: ", err)
        return []
    }
}

export const addReceipt = async (receipt: Omit<Receipts, 'receipt_id' | 'created_at'>): Promise<Receipts> => {
    try{
        const res = await axios.post<Receipts>(`${url}/receipts`, receipt)
        return res.data
    }
    catch(err){
        console.error("Failed to add receipt: ", err)
        throw err
    }
}

export const updateReceipt = async (id: number, receipt: Partial<Receipts>): Promise<Receipts> => {
    try{
        const res = await axios.put<Receipts>(`${url}/receipts/${id}`, receipt)
        return res.data
    }
    catch(err){
        console.error("Failed to update receipt: ", err)
        throw err
    }
}

export const deleteReceipt = async (id: number): Promise<void> => {
    try{
        await axios.delete(`${url}/receipts/${id}`)
    }
    catch(err){
        console.error("Failed to delete receipt: ", err)
        throw err
    }
}