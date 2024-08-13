# XML Nota Fiscal Processor

Este projeto é uma API que resolve um problema específico relacionado à falta da tag `<rastro>` no XML de notas fiscais faturadas para produtos que não pertencem ao grupo "medicamento". A ausência dessa tag impede que o lote do produto seja capturado automaticamente ao importar o XML para dar entrada na nota fiscal. A API desenvolvida permite que você importe o XML ou forneça a chave de acesso da nota fiscal, extrai as informações necessárias e adiciona a tag `<rastro>` ao XML, garantindo que o lote seja identificado automaticamente.

## Funcionalidades

- **Importação de XML**: Permite o upload de um arquivo XML de uma nota fiscal para processá-lo.
- **Leitura de Chave de Acesso**: Permite a leitura da nota fiscal usando a chave de acesso, sem necessidade de upload de arquivos.
- **Inserção Automática da Tag `<rastro>`**: Extrai as informações do lote da tag `<infAdProd>` do XML e as insere na tag `<rastro>` correspondente ao produto.
- **Atualização e Download do XML**: Após o processamento, o XML atualizado pode ser baixado para ser utilizado na entrada da nota fiscal.

## Tecnologias Utilizadas

- **Node.js**: Plataforma usada para desenvolver a API.
- **Express**: Framework utilizado para criar a estrutura da API.





