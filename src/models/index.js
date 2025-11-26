import getNeogma from "../config/neogma.js";
import User from "./UserModel.js";
import Post from "./PostModel.js";
import Comment from "./CommentModel.js";

// Inicializar índices e restrições no Neo4j
(async () => {
    try {
        const neogma = getNeogma();
        
        // User Constraints
        await neogma.queryRunner.run(
            'CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE'
        );
        await neogma.queryRunner.run(
            'CREATE CONSTRAINT user_username IF NOT EXISTS FOR (u:User) REQUIRE u.username IS UNIQUE'
        );
        await neogma.queryRunner.run(
            'CREATE CONSTRAINT user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE'
        );

        // Post Constraints
        await neogma.queryRunner.run(
            'CREATE CONSTRAINT post_id IF NOT EXISTS FOR (p:Post) REQUIRE p.id IS UNIQUE'
        );

        // Comment Constraints
        await neogma.queryRunner.run(
            'CREATE CONSTRAINT comment_id IF NOT EXISTS FOR (c:Comment) REQUIRE c.id IS UNIQUE'
        );
        
        console.log('Índices e restrições da Rede Social criados com sucesso');
    } catch (error) {
        console.log('Erro ao criar índices:', error.message);
    }
})();

export { User, Post, Comment };



