const { spawn } = require('child_process');
const { config } = require('./config')

const evaluateArticleType = async (url) => {
    if(url.includes('news')){
        return 'news'
    }
    else if(url.includes('/blog')){
        return 'blog'
    }
    else if(url.includes('/article')){
        return 'article'
    }
    else if(url.includes('/press-releases')){
        return 'press release'
    }
    else if (url.includes('/white-paper')){
        return 'white paper'
    }
    else if (url.includes('/stories')){
        return 'stories'
    }
    else if (url.includes('/publications')){
        return 'publications'
    }
    else if (url.includes('.pdf') 
        || url.includes('.doc')
        || url.includes('.docx')
        || url.includes('.ppt')
        || url.includes('.odt') 
        || url.includes('.rtf') 
        || url.includes('.txt')
        || url.includes('docs.goo') 
    ){
        return 'document'
    }
    else if(url.includes('/speeches')){
        return 'speeches'
    }
    else if(url.includes('/event')){
      return 'event'
  }
    else if(url.includes('/project')){
        return 'project'
    }
    else return 'webpage'

}

const  extractLanguageFromUrl = (url) => {
    const urlParts = url.split('/');
    const languageIndex = urlParts.indexOf(config['baseUrl.basic']) + 1;
    
    if (languageIndex >= urlParts.length) {
      return null;
    }
    
    const languageCode = urlParts[languageIndex];
    
    if (languageCode.length !== 2) {
      return null;
    }

    return languageCode;
}


const extractPdfContent = async (url) => {
  return new Promise((resolve, reject) => {
    const python = spawn('python', ['-u', 'pdf.py', url]);
    
    let output = '';
    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error(`python script exited with code ${code}`));
      }
    });
    python.on('error', (error) => {
      reject(error);
    });
  });
};


const article_types = [
  'project',
  'event',
  'speeches',
  'stories',
  'white-paper',
  'article',
  'blog',
  'news',
  'press-releases'
]

module.exports = {
    evaluateArticleType,
    extractLanguageFromUrl,
    extractPdfContent,
    article_types
}