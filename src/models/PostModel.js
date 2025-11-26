import { ModelFactory } from 'neogma';
import getNeogma from '../config/neogma.js';

const postSchema = {
    label: 'Post',
    schema: {
        id: {
            type: 'string',
            required: true,
        },
        content: {
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
        author: {
            model: 'User',
            direction: 'in',
            name: 'POSTED',
        },
        likedBy: {
            model: 'User',
            direction: 'in',
            name: 'LIKES',
        },
        comments: {
            model: 'Comment',
            direction: 'in',
            name: 'ON',
        }
    },
};

const Post = ModelFactory(postSchema, getNeogma());

getNeogma().modelsByName['Post'] = Post;

export default Post;
