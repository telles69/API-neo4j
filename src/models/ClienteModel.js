import { ModelFactory } from 'neogma';
import getNeogma from '../config/neogma.js';

const clienteSchema = {
    label: 'Cliente',
    schema: {
        id: {
            type: 'integer',
            required: true,
        },
        nome: {
            type: 'string',
            required: true,
        },
        cpf: {
            type: 'string',
            required: true,
            unique: true,
        },
        dataNascimento: {
            type: 'string',
            required: true,
        },
        createdAt: {
            type: 'string',
            required: true,
        },
        updatedAt: {
            type: 'string',
            required: true,
        },
    },
    relationships: {
        emprestiimos: {
            model: 'Emprestimo',
            direction: 'in',
            name: 'EMPRESTADO_PARA',
        },
    },
};

const Cliente = ModelFactory(clienteSchema, getNeogma());

export default Cliente;
