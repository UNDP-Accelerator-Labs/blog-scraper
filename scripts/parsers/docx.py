from sys import path as syspath
from os import getcwd, remove, makedirs
from os.path import join, splitext, exists, dirname, basename
from shutil import rmtree
from pandas import to_datetime

from docx2python import docx2python
from docx2python.iterators import enum_cells

## LOAD OPERATIONS
syspath.append(join(dirname(__file__), 'operations/'))
from extract import extract as extract_text


def remove_empty_paragraphs (tables): ## THIS IS NOT CURRENTLY USED
	for (i, j, k), cell in enum_cells(tables):
		tables[i][j][k] = [x for x in cell if x]
	return tables

def parse_doc (file, datum = {}, complex_content = False):
	download_dir = join(getcwd(), '../../downloads/')
	if not exists(download_dir):
		makedirs(download_dir)

	doc = docx2python(file)
	metadata = doc.properties

	name, ext = splitext(file)
	datum['name'] = basename(file)
	datum['type'] = ext

	for key in metadata:
		if key == 'creator': datum['author'] = metadata[key]
		elif key in ['title','subject','keywords','content']: datum[key] = metadata[key]
		elif key in ['created','modified']: datum[key] = to_datetime(metadata[key]).strftime('%m/%d/%Y, %H:%M')
		else: 
			if 'additional_metadata' not in datum or datum['additional_metadata'] is None: datum['additional_metadata'] = {}
			datum['additional_metadata'][key] = metadata[key] ## ADDITIONAL METADATA
	
	if complex_content == True: datum['content'] = remove_empty_paragraphs(doc.document)
	else: datum['content'] = doc.text

	for name, image in doc.images.items():
		file = join(download_dir, name)
		with open(file, 'wb') as f:
			f.write(image)

		if complex_content == True: 
			## TO DO: IF COMPLEX CONTENT IS TRUE, THEN ADD IMAGE DATA TO ARRAY
			pass
		else: datum['content'] = datum['content'].replace('{}----'.format(name), 'image:\n{}----\n\n'.format(extract_text(file)))

		remove(file)

	## REMOVE THE TEMP DIR
	rmtree(download_dir)

	return datum
