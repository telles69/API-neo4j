import Cliente from "../models/ClienteModel.js";

const get = async(req,res) =>{
    try {
        const id = req.params.id ? req.params.id.toString().replace(/\D/g, '') : null
        if (!id) {
            const response = await Cliente.findAll()
            return res.status(200).send({
                message: 'Dados encontrados',
                data: response
            })
        }

        const response = await Cliente.findOne(id)
        if (!response) {
            return res.status(404).send('not found')
        }
        return res.status(200).send({
            message: 'Dados encontrados',
            data: response
        })
    } catch (error) {
        return res.status(500).send({
            message: error.message
        })
    }
}

const create = async (corpo) => {
    try {
        const {
            nome,
            cpf,
            dataNascimento
        } = corpo

        const response = await Cliente.create({
            nome,
            cpf,
            dataNascimento
        })

        return response
    } catch (error) {
        throw new Error(error.message)
    }
}

const update = async (corpo, id) => {
    try {
        const response = await Cliente.findOne(id)
        if (!response) {
            throw new Error('Cliente não encontrado')
        }

        const updated = await Cliente.update(id, corpo)
        return updated;
    } catch (error) {
        throw new Error(error.message)
    }
}

const destroy = async (req,res) => {
    try {
        const id = req.params.id ? req.params.id.toString().replace(/\D/g, '') : null
        if (!id) {
            return res.status(400).send('informa ai paizao')
        }

        const response = await Cliente.findOne(id)
        if(!response){
            return res.status(404).send('not found')
        }

        await Cliente.destroy(id)

        return res.status(200).send({
            message: 'registro excluido',
            data:response
        })
    } catch (error) {
        return res.status(500).send({
            message: error.message
        })
    }
}

const persist = async (req,res) => {
    try {
        const id = req.params.id ? req.params.id.toString().replace(/\D/g, '') : null

        if(!id){
            const response = await create(req.body)
            return res.status(201).send({
                message: 'criado com sucesso!',
                data: response
            })
        }
        const response = await update(req.body, id)
            return res.status(201).send({
                message: 'atualizado com sucesso!',
                data: response
            })
    } catch (error) {
        return res.status(500).send({
            message: error.message
        })
    }
        
}


export default {
    get,
    persist,
    update,
    destroy
}