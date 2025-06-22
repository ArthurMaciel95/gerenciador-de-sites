const axios = require('axios');
const cheerio = require('cheerio');

const scrapeMetaTags = async (url) => {
  try {
    // Adicionar protocolo se não existir
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const response = await axios.get(url, {
      timeout: 10000, // 10 segundos de timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // Extrair meta tags
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || '';
    
    // Extrair imagem e resolver URL
    let image = $('meta[property="og:image"]').attr('content') || 
                $('meta[name="twitter:image"]').attr('content') || 
                $('meta[property="og:image:secure_url"]').attr('content') || '';

    // Resolver URL da imagem se ela existir
    if (image) {
      try {
        // Se a URL da imagem for relativa, converter para absoluta
        if (image.startsWith('/')) {
          // URL relativa à raiz do domínio
          const urlObj = new URL(url);
          image = `${urlObj.protocol}//${urlObj.host}${image}`;
        } else if (image.startsWith('./') || !image.startsWith('http')) {
          // URL relativa ao diretório atual ou sem protocolo
          const urlObj = new URL(url);
          const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname.replace(/\/[^\/]*$/, '/')}`;
          image = new URL(image, baseUrl).href;
        }
      } catch (error) {
        console.error('Erro ao resolver URL da imagem:', error.message);
        image = ''; // Se não conseguir resolver, usar string vazia
      }
    }

    return {
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
      success: true
    };
  } catch (error) {
    console.error('Erro ao fazer scraping:', error.message);
    return {
      title: '',
      description: '',
      image: '',
      success: false,
      error: error.message
    };
  }
};

module.exports = { scrapeMetaTags }; 