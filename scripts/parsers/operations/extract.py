from sys import path as syspath
from os.path import splitext, join, dirname

import textract

## LOAD VARS
syspath.append(join(dirname(__file__), '../vars/'))
from textract_formats import formats as textract_available_formats

def extract (file):
	name, ext = splitext(file)
	if ext in textract_available_formats: 
		text = textract.process(
			file,
			method = 'tesseract',
			# language='nor'
		).decode('UTF-8')
		text = text.replace('\xa0', ' ')
		text = text.replace('\x0c', '\n')
		return text.strip()
	else:
		return None