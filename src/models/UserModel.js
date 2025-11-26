import { ModelFactory } from 'neogma';
import getNeogma from '../config/neogma.js';

const userSchema = {
    label: 'User',
    schema: {
        id: {
            type: 'string',
            required: true,
        },
        username: {
            type: 'string',
            required: true,
        },
        email: {
            type: 'string',
            required: true,
        },
        password: {
            type: 'string',
            required: true,
        },
        bio: {
            type: 'string',
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
        posts: {
            model: 'Post',
            direction: 'out',
            name: 'POSTED',
        },
        follows: {
            model: 'User',
            direction: 'out',
            name: 'FOLLOWS',
        },
        likes: {
            model: 'Post',
            direction: 'out',
            name: 'LIKES',
        },
    },
};

const User = ModelFactory(userSchema, getNeogma());

getNeogma().modelsByName['User'] = User;

export default User;
