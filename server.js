const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { DOMParser, XMLSerializer } = require('xmldom');
const app = express();
const port = 1290;
const { fetchAccessToken, updateAccessTokenPeriodically, authenticateUser } = require('./refresh_token'); // Agora usando require

app.use(cors());
app.use(express.static('public'));
const upload = multer();
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


const initializeAuthentication = async () => {
  try {
      await authenticateUser(); 
      await updateAccessTokenPeriodically();
      setInterval(updateAccessTokenPeriodically, 20 * 60 * 1000); 
  } catch (error) {
      console.error("Erro ao inicializar a autenticação:", error);
  }
};

initializeAuthentication();

const makeAuthenticatedRequest = async (url, token, method = 'GET', body = null) => {
  const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
  };
  const options = {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
  };

  const response = await fetch(url, options);

  if (!response.ok) {
      if (response.status === 401) {
          const refreshToken = localStorage.getItem("refresh_token");

          if (refreshToken) {
              const newAccessToken = await fetchAccessToken(refreshToken);
              return await makeAuthenticatedRequest(url, newAccessToken, method, body);
          } else {
              throw new Error("Token expirado e refresh token não encontrado. O usuário precisa autenticar novamente.");
          }
      }
  }

  return response.json();
};

app.post('/process-xml', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo foi enviado');
  }

  const xml = req.file.buffer.toString();


  const domParser = new DOMParser();
  const xmlDoc = domParser.parseFromString(xml, 'text/xml');
  const xmlSerializer = new XMLSerializer();


  const dets = xmlDoc.getElementsByTagName('det');
  for (let i = 0; i < dets.length; i++) {
    const det = dets[i];
    const infAdProd = det.getElementsByTagName('infAdProd')[0];
    if (infAdProd) {
      const infAdProdText = infAdProd.textContent.trim();

      console.log('Conteúdo de infAdProd:', infAdProdText);

      const regex = /Lote:\s*(.*?)\s*Quantidade:\s*(\S+)(?:\s*Fabricacao:\s*(\d{2}\/\d{2}\/\d{4}))?(?:\s*Validade:\s*(\d{2}\/\d{2}\/\d{4}))?/;
      const match = infAdProdText.match(regex);
      if (match) {
        const rastroData = {
          nLote: match[1] || '',
          qLote: match[2] || '',
          dFab: match[3] ? formatDate(match[3]) : '',
          dVal: match[4] ? formatDate(match[4]) : ''
        };

        console.log('Dados extraídos para rastro:', rastroData);

        if (rastroData.dFab && rastroData.dVal) {
          const prod = det.getElementsByTagName('prod')[0];
          if (prod) {
            const rastro = xmlDoc.createElement('rastro');
            for (const [key, value] of Object.entries(rastroData)) {
              const element = xmlDoc.createElement(key);
              element.textContent = value;
              rastro.appendChild(element);
            }

            prod.appendChild(rastro);
          } else {
            console.error('Tag <prod> não encontrada dentro de <det>');
            return res.status(400).send('Tag <prod> não encontrada dentro de <det>');
          }
        } else {
          console.log('Dados insuficientes para criar a tag <rastro>.');
        }
      } else {
        console.error('Formato inesperado de infAdProd:', infAdProdText);
        return res.status(400).send('Formato inesperado de infAdProd');
      }
    }
  }

  const updatedXml = xmlSerializer.serializeToString(xmlDoc);

  res.setHeader('Content-Disposition', 'attachment; filename="updated.xml"');
  res.setHeader('Content-Type', 'application/xml');
  res.send(updatedXml);
});

app.post('/process-xml-text', express.json(), (req, res) => {
  const xml = req.body.xml;

  if (!xml) {
    return res.status(400).send('Nenhum XML foi enviado');
  }

  const domParser = new DOMParser();
  const xmlDoc = domParser.parseFromString(xml, 'text/xml');
  const xmlSerializer = new XMLSerializer();

  const dets = xmlDoc.getElementsByTagName('det');
  for (let i = 0; i < dets.length; i++) {
    const det = dets[i];
    const infAdProd = det.getElementsByTagName('infAdProd')[0];
    if (infAdProd) {
      const infAdProdText = infAdProd.textContent.trim();

      console.log('Conteúdo de infAdProd:', infAdProdText);

      const regex = /Lote:\s*(.*?)\s*Quantidade:\s*(\S+)(?:\s*Fabricacao:\s*(\d{2}\/\d{2}\/\d{4}))?(?:\s*Validade:\s*(\d{2}\/\d{2}\/\d{4}))?/;
      const match = infAdProdText.match(regex);
      if (match) {
        const rastroData = {
          nLote: match[1] || '',
          qLote: match[2] || '',
          dFab: match[3] ? formatDate(match[3]) : '',
          dVal: match[4] ? formatDate(match[4]) : ''
        };

        console.log('Dados extraídos para rastro:', rastroData);

        if (rastroData.dFab && rastroData.dVal) {
          const prod = det.getElementsByTagName('prod')[0];
          if (prod) {
            const rastro = xmlDoc.createElement('rastro');
            for (const [key, value] of Object.entries(rastroData)) {
              const element = xmlDoc.createElement(key);
              element.textContent = value;
              rastro.appendChild(element);
            }

            prod.appendChild(rastro);
          } else {
            console.error('Tag <prod> não encontrada dentro de <det>');
            return res.status(400).send('Tag <prod> não encontrada dentro de <det>');
          }
        } else {
          console.log('Dados insuficientes para criar a tag <rastro>.');
        }
      } else {
        console.error('Formato inesperado de infAdProd:', infAdProdText);
        return res.status(400).send('Formato inesperado de infAdProd');
      }
    }
  }

  const updatedXml = xmlSerializer.serializeToString(xmlDoc);

  res.setHeader('Content-Disposition', 'attachment; filename="updated.xml"');
  res.setHeader('Content-Type', 'application/xml');
  res.send(updatedXml);
});





app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
