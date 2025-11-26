import { ModelFactory } from 'neogma';
import getNeogma from '../config/neogma.js';

const emprestimoSchema = {
    label: 'Emprestimo',
    schema: {
        id: {
            type: 'integer',
            required: true,
        },
        dataEmprestimo: {
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
        cliente: {
            model: 'Cliente',
            direction: 'out',
            name: 'EMPRESTADO_PARA',
            schema: {
                properties: {},
            },
        },
    },
};

const Emprestimo = ModelFactory(emprestimoSchema, getNeogma());

export default Emprestimo;
