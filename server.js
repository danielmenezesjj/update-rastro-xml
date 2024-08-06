const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { DOMParser, XMLSerializer } = require('xmldom');
const app = express();
const port = 1290;

// Adiciona o middleware cors
app.use(cors());

// Serve arquivos estáticos da pasta 'public'
app.use(express.static('public'));

// Configura o multer para lidar com o upload de arquivos
const upload = multer();

// Função para converter a data no formato YYYY-MM-DD
const formatDate = (dateStr) => {
  if (typeof dateStr !== 'string') {
    console.error('Data fornecida não é uma string:', dateStr);
    return '';
  }

  const [day, month, year] = dateStr.split('/').map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    console.error('Erro ao parsear a data:', dateStr);
    return '';
  }

  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

// Endpoint para processar o upload de arquivo XML
app.post('/process-xml', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo foi enviado');
  }

  const xml = req.file.buffer.toString();

  // Cria um novo DOMParser e XMLSerializer
  const domParser = new DOMParser();
  const xmlDoc = domParser.parseFromString(xml, 'text/xml');
  const xmlSerializer = new XMLSerializer();

  // Encontra as tags <det>
  const dets = xmlDoc.getElementsByTagName('det');
  for (let i = 0; i < dets.length; i++) {
    const det = dets[i];
    const infAdProd = det.getElementsByTagName('infAdProd')[0];
    if (infAdProd) {
      const infAdProdText = infAdProd.textContent.trim();

      console.log('Conteúdo de infAdProd:', infAdProdText);

      // Extrai as informações de infAdProd usando regex
      const regex = /Lote:\s*(.*?)\s*Quantidade:\s*(.*?)\s*Fabricacao:\s*(.*?)\s*Validade:\s*(.*)/;
      const match = infAdProdText.match(regex);
      if (match) {
        const rastroData = {
          nLote: match[1] || '',
          qLote: match[2] || '',
          dFab: formatDate(match[3] || ''),
          dVal: formatDate(match[4] || '')
        };

        console.log('Dados extraídos para rastro:', rastroData);

        // Encontra a tag <prod> dentro de <det>
        const prod = det.getElementsByTagName('prod')[0];
        if (prod) {
          // Cria a nova tag <rastro>
          const rastro = xmlDoc.createElement('rastro');
          for (const [key, value] of Object.entries(rastroData)) {
            const element = xmlDoc.createElement(key);
            element.textContent = value;
            rastro.appendChild(element);
          }

          // Adiciona a nova tag <rastro> dentro de <prod>
          prod.appendChild(rastro);
        } else {
          console.error('Tag <prod> não encontrada dentro de <det>');
          return res.status(400).send('Tag <prod> não encontrada dentro de <det>');
        }
      } else {
        console.error('Formato inesperado de infAdProd:', infAdProdText);
        return res.status(400).send('Formato inesperado de infAdProd');
      }
    }
  }

  // Converte o XML atualizado de volta para string
  const updatedXml = xmlSerializer.serializeToString(xmlDoc);

  // Configura a resposta para download do arquivo
  res.setHeader('Content-Disposition', 'attachment; filename="updated.xml"');
  res.setHeader('Content-Type', 'application/xml');
  res.send(updatedXml);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
