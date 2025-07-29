import supabase from "@/lib/supabaseAdmin";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse){
    if(req.method === "GET"){
        const {data, error} = await supabase.from('users').select('*')
        if(error) return res.status(500).json({error: error.message})
        res.status(200).json(data)
    }else if (req.method === "POST"){
        const {title, content} = req.body
        const {data, error} = await supabase.from('users').insert({title, content})
        if(error) return res.status(500).json({error: error.message})
        res.status(200).json(data)
    }else if (req.method === "PUT"){
        const {id, title, content} = req.body
        const {data, error} = await supabase.from('users').update({title, content}).eq('id', id)
        if(error) return res.status(500).json({error: error.message})
        res.status(200).json(data)
    }else if (req.method === "DELETE"){
        const {id} = req.body
        const {data, error} = await supabase.from('users').delete().eq('id', id)
        if(error) return res.status(500).json({error: error.message})
        res.status(200).json(data)
    }else{
        res.status(405).json({error: "Method not allowed"})
    }
}