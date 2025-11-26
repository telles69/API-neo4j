import getNeogma from "../config/neogma.js";
import Cliente from "./ClienteModel.js";
import Emprestimo from "./EmprestimoModel.js";

// Inicializar índices e restrições no Neo4j
(async () => {
    try {
        const neogma = getNeogma();
        // Criar índices e restrições
        await neogma.queryRunner.run(
            'CREATE INDEX cliente_id IF NOT EXISTS FOR (c:Cliente) ON (c.id)'
        );
        await neogma.queryRunner.run(
            'CREATE CONSTRAINT cliente_cpf IF NOT EXISTS FOR (c:Cliente) REQUIRE c.cpf IS UNIQUE'
        );
        await neogma.queryRunner.run(
            'CREATE INDEX emprestimo_id IF NOT EXISTS FOR (e:Emprestimo) ON (e.id)'
        );
        
        console.log('Índices e restrições criados com sucesso');
    } catch (error) {
        console.log('Índices e restrições já existem ou erro:', error.message);
    }
})();

export { Cliente, Emprestimo };


