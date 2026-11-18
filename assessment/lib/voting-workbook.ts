import * as XLSX from 'xlsx/xlsx.mjs';
// Add an OOXML drawing to the generated workbook. CSV has no image support.
export function electionWorkbook(values:(string|number)[][],logo:Uint8Array){
 const sheet=XLSX.utils.aoa_to_sheet(values);sheet['!cols']=[{wch:35},{wch:35},{wch:15},{wch:15},{wch:20},{wch:15}];
 const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,sheet,'Election results');
 const zip=XLSX.CFB.read(XLSX.write(workbook,{type:'buffer',bookType:'xlsx'}),{type:'buffer'});
 const get=(path:string)=>Buffer.from(XLSX.CFB.find(zip,path).content).toString('utf8');
 const put=(path:string,data:string|Uint8Array)=>XLSX.CFB.utils.cfb_add(zip,path,typeof data==='string'?Buffer.from(data):Buffer.from(data));
 put('/xl/worksheets/sheet1.xml',get('/xl/worksheets/sheet1.xml').replace('</worksheet>','<drawing r:id="rIdLogo"/></worksheet>'));
 put('/xl/worksheets/_rels/sheet1.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>');
 put('/xl/drawings/drawing1.xml','<?xml version="1.0" encoding="UTF-8"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><xdr:oneCellAnchor><xdr:from><xdr:col>6</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="914400" cy="914400"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="1" name="School logo"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rIdImage"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>');
 put('/xl/drawings/_rels/drawing1.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdImage" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/school-logo.png"/></Relationships>');
 put('/xl/media/school-logo.png',logo);
 put('/[Content_Types].xml',get('/[Content_Types].xml').replace('</Types>','<Default Extension="png" ContentType="image/png"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>'));
 return new Uint8Array(XLSX.CFB.write(zip,{type:'buffer',fileType:'zip'}));
}
