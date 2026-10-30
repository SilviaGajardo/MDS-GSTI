export interface DepartmentOption {
  department: string;
  area: string;
  name: string;
}

export const DEPARTMENTS_DATA: DepartmentOption[] = [
  // ALCALDÍA
  { department: 'ALCALDÍA', area: 'Secretaria', name: 'Natalia Moya' },
  { department: 'ALCALDÍA', area: 'Alcaldía', name: 'Aquiles Escobedo' },
  { department: 'ALCALDÍA', area: 'Jefe Gabinete', name: 'Mauricio González - Claudia Moreno' },

  // ADMINISTRADOR MUNICIPAL
  { department: 'ADMINISTRADOR MUNICIPAL', area: 'Administrador Municipal', name: 'Leonardo Farias Canales' },

  // SECRETARIA MUNICIPAL
  { department: 'SECRETARIA MUNICIPAL', area: 'Oficina de Partes', name: 'Luz' },
  { department: 'SECRETARIA MUNICIPAL', area: 'Personalidad jurídica', name: 'Ana Pozo' },
  { department: 'SECRETARIA MUNICIPAL', area: 'Transparencia', name: 'Luis' },
  { department: 'SECRETARIA MUNICIPAL', area: 'Concejo', name: 'Miuccia' },
  { department: 'SECRETARIA MUNICIPAL', area: 'Decretos', name: 'Marcela Fuentes / Caro' },

  // OBRAS
  { department: 'OBRAS', area: 'Secretaria', name: 'Maria Alicia Muñoz' },
  { department: 'OBRAS', area: 'Atención de Público', name: 'Valeria Ayala' },
  { department: 'OBRAS', area: 'Secretaria Edificación', name: 'Mirtha Valdez' },
  { department: 'OBRAS', area: 'ITO', name: 'Ana Saavedra' },
  { department: 'OBRAS', area: 'Arquitecto Urbanismo', name: 'Mario Mendoza' },
  { department: 'OBRAS', area: 'Arquitecto Urbanismo', name: 'Lorena Jara' },
  { department: 'OBRAS', area: 'Arquitecto Edificación', name: 'Jonathan Galvez' },
  { department: 'OBRAS', area: 'ITO', name: 'Karina González / Felipe Perez' },
  { department: 'OBRAS', area: 'Arquitecto Edificación', name: 'Carina Gonzalez' },

  // ASESORIA JURIDICA
  { department: 'ASESORIA JURIDICA', area: 'Secretaria', name: 'Yadranka Núñez' },
  { department: 'ASESORIA JURIDICA', area: 'Abogado', name: 'Rodrigo Lantadilla' },
  { department: 'ASESORIA JURIDICA', area: 'Regularización de bienes y SERNAC', name: 'Juan Pablo Cornejo - Maria Paz Huerta' },
  { department: 'ASESORIA JURIDICA', area: 'Abogada', name: 'Diane Gaune' },

  // SECPLA
  { department: 'SECPLA', area: 'Secretaria', name: 'Fabiola González' },
  { department: 'SECPLA', area: 'Presupuesto y Rendiciones', name: 'Daniella Alfaro - Gabriela Mejias' },
  { department: 'SECPLA', area: 'Coordinadora de Presupuesto y Rendiciones', name: 'Valeria Stange' },
  { department: 'SECPLA', area: 'Analista Presupuesto y Rendiciones', name: 'Samary Medina' },
  { department: 'SECPLA', area: 'Asesoría Urbana', name: 'Alejandra' },
  { department: 'SECPLA', area: 'Licitaciones', name: 'Jose Luis Cisterna / Liliana Cornejo / Yannira Bugueño / María Inés Navarro / Erick Hermosilla' },
  { department: 'SECPLA', area: 'Proyectos', name: 'Silvana Alvial - Diego Ayala - Laura Aranguez' },
  { department: 'SECPLA', area: 'Pavimentos Participativos', name: 'Carolina Tecay' },
  { department: 'SECPLA', area: 'Informática', name: 'Benjamín Muñoz - Encargado / Nayadeth Navarro - Secretaria / Brandon Olguín - Soporte / Victor Pardo - Soporte / Alexis Alegría - Soporte / Miguel Tapia - Desarrollador / Diego Marin - Desarrollador / Silvia Gajardo - Transformación Digital' },

  // DIMAO (Basura, Aseo y Ornato)
  { department: 'DIMAO', area: 'Encargado', name: 'Juan Farias' },
  { department: 'DIMAO', area: 'Secretaria Operaciones', name: 'Cecilia Mella' },
  { department: 'DIMAO', area: 'Operaciones', name: 'Wendy Concha' },
  { department: 'DIMAO', area: 'ITS Consumos Básicos', name: 'Marcela González' },
  { department: 'DIMAO', area: 'Administrativa de Medio Ambiente', name: 'Carmen Gloria Díaz' },
  { department: 'DIMAO', area: 'ITS Combustibles', name: 'Luis Miranda' },
  { department: 'DIMAO', area: 'Bodega Operaciones', name: 'Laura Cuevas' },
  { department: 'DIMAO', area: 'ITS Alumbrado público', name: 'Cristian albear' },
  { department: 'DIMAO', area: 'Medio Ambiente', name: 'Fernanda Ramirez - Mirna San Martín - Franshesca Raimidia' },
  { department: 'DIMAO', area: 'ITS suministros de ferretería y pólizas seguros', name: 'Cristopher Olivo' },
  { department: 'DIMAO', area: 'ITS Servicio de Agua Potable', name: 'Luis Ray' },
  { department: 'DIMAO', area: 'ITS Servicio de recolección de basura y áreas verdes', name: 'Rodrigo Rodríguez' },
  { department: 'DIMAO', area: 'Emergencias', name: 'Marcela Ibarra' },

  // CONCEJALES
  { department: 'CONCEJALES', area: 'Secretaria de Concejales', name: 'Camila Osorio' },
  { department: 'CONCEJALES', area: 'Concejales', name: 'Daniela Diaz' },
  { department: 'CONCEJALES', area: 'Concejales', name: 'Ignacio Arias' },
  { department: 'CONCEJALES', area: 'Concejales', name: 'Francisco Garrido' },
  { department: 'CONCEJALES', area: 'Concejales', name: 'Paz Gonzalez' },
  { department: 'CONCEJALES', area: 'Concejales', name: 'Marcela Rojas' },
  { department: 'CONCEJALES', area: 'Concejales', name: 'Rocío López' },

  // ADMINISTRACION Y FINANZAS
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Secretaria', name: 'Fanny Vega' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Tesorería', name: 'Escarlett Rojas' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Tesorería', name: 'Eric Gutierrez - Tesorero' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Tesorería', name: 'Constanza Carotti - Pool' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Tesorería', name: 'Pamela Olivares - Caja' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Tesorería', name: 'Ana Muñoz - Caja' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Contabilidad', name: 'Nicolas' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Contabilidad', name: 'Natalia Contreras' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Contabilidad', name: 'Catalina' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Adquisiciones', name: 'Soledad Olivares - Encargada' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Adquisiciones', name: 'Joel Martinez' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Adquisiciones', name: 'Caro' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Activo Fijo', name: 'Soledad Morales' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Recursos Humanos', name: 'Libertad Couchot - Jefe' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Recursos Humanos', name: 'Sandra Riquelme - Secretaria' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Recursos Humanos', name: 'Anais' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Recursos Humanos', name: 'Adriana Labbe - Remuneraciones' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Recursos Humanos', name: 'Joel - Remuneraciones' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Recursos Humanos', name: 'Karen - Remuneraciones' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Cobranzas', name: 'Victor Riquelme - Jefe' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Cobranzas', name: 'Joel Martínez' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Cobranzas', name: 'Vanessa Martínez' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Patentes Comerciales', name: 'Joel Castillo' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Patentes Comerciales', name: 'Miguel Orozco' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Patentes Comerciales', name: 'Jaime Palma - Regularización' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'OCM SII', name: 'Valentín San Martín' },
  { department: 'ADMINISTRACION Y FINANZAS', area: 'Oficina Derechos de Aseo', name: 'Karol Campos' },

  // TRANSITO
  { department: 'TRANSITO', area: 'Secretaria', name: 'Peggi ahumada' },
  { department: 'TRANSITO', area: 'Permiso de Circulación', name: 'Marcela Gonzalez' },
  { department: 'TRANSITO', area: 'Encargada Licencia de Conducir', name: 'María Elena Parada' },

  // CONTROL (Pago de partes)
  { department: 'CONTROL', area: 'Secretaria', name: 'Silvana Urrea' },
  { department: 'CONTROL', area: 'Revisores', name: 'Irma González' },
  { department: 'CONTROL', area: 'Revisores', name: 'Marco Cordovez' },
  { department: 'CONTROL', area: 'Revisores', name: 'Claudia Osorio' },
  { department: 'CONTROL', area: 'Revisores', name: 'Leticia Aguilera' },
  { department: 'CONTROL', area: 'Revisores', name: 'Pablo Navarrete' },

  // DIDECO (Feria emprendedores)
  { department: 'DIDECO', area: 'Secretaria', name: 'Javiera Arriola' },
  { department: 'DIDECO', area: 'Recepción', name: 'Dominique Farias' },
  { department: 'DIDECO', area: 'Comunicaciones', name: 'Carlos Pozo' },
  { department: 'DIDECO', area: 'Compras', name: 'Araceli donoso' },
  { department: 'DIDECO', area: 'Adulto mayor', name: 'Juan Cornejo' },
  { department: 'DIDECO', area: 'Organizaciones comunitarias / Programas sociales', name: 'Mario Arriaza' },
  { department: 'DIDECO', area: 'Apoyo técnico del director', name: 'Gabriela Bastias' },
  { department: 'DIDECO', area: 'Gestión y control', name: 'Aracely Donoso' },
  { department: 'DIDECO', area: 'Oficina Local de la Niñez', name: 'Mónica Castillo' },
  { department: 'DIDECO', area: 'Programa Red Local de Apoyos y Cuidados', name: 'Hernán Le Quesne' },
  { department: 'DIDECO', area: 'Senda', name: 'Tomás González' },
  { department: 'DIDECO', area: 'Programa Mujeres Jefas de Hogar', name: 'Tamara Fuentes' },
  { department: 'DIDECO', area: 'Mujer y Equidad de Género/Programa 4 a 7', name: 'Ayline Martínez' },
  { department: 'DIDECO', area: 'Infancia y juventud', name: 'Bárbara Cerda' },
  { department: 'DIDECO', area: 'Primeras naciones', name: 'Eugenia Calquín' },
  { department: 'DIDECO', area: 'Programa de Desarrollo Local', name: 'Gloria Gutierrez' },
  { department: 'DIDECO', area: 'Discapacidad', name: 'Teresita Contreras' },
  { department: 'DIDECO', area: 'Biblioteca', name: 'Jacqueline Rodríguez' },
  { department: 'DIDECO', area: 'Fomento Productivo/Desarrollo Económico local', name: 'Valeria Valderrama' },
  { department: 'DIDECO', area: 'Turismo', name: 'Víctor Peñaloza' },
  { department: 'DIDECO', area: 'Cultura', name: 'Mónica Sepúlveda' },
  { department: 'DIDECO', area: 'OMIL', name: 'Marina Del Carmen Montes' },
  { department: 'DIDECO', area: 'CIAM', name: 'Mauricio Vidal' },
  { department: 'DIDECO', area: 'Crecer en Comunidad', name: 'Claudia Cornejo' },
  { department: 'DIDECO', area: 'Transformando Barrios', name: 'Valesca López' },

  // DIDESO (Registro Social de Hogares/Beneficios)
  { department: 'DIDESO', area: 'Secretaria', name: 'Verónica Villarroel' },
  { department: 'DIDESO', area: 'Recepción', name: 'Camila Navarro' },
  { department: 'DIDESO', area: 'Secretaria Asistente Social', name: 'Mirta Hernández' },
  { department: 'DIDESO', area: 'Asistente Social / Pañales', name: 'Vanesa González' },
  { department: 'DIDESO', area: 'Técnico Social', name: 'María Quintremil' },
  { department: 'DIDESO', area: 'Encargado de Estratificación', name: 'Juan Alvárez' },
  { department: 'DIDESO', area: 'Administración F.P.S', name: 'Claudia Fuentes' },
  { department: 'DIDESO', area: 'Administración F.P.S', name: 'Iris Molina' },
  { department: 'DIDESO', area: 'Administración F.P.S', name: 'Piero Farias' },
  { department: 'DIDESO', area: 'Asistente Social', name: 'Francisca' },
  { department: 'DIDESO', area: 'Asistente Social', name: 'Waldo Núñez' },
  { department: 'DIDESO', area: 'Vivienda', name: 'Vivienda' },

  // COMUNICACIONES
  { department: 'COMUNICACIONES', area: 'Encargado', name: 'Carlos Pozo' },
  { department: 'COMUNICACIONES', area: 'Secretaria', name: 'Carolina Duque' },

  // SEGURIDAD PUBLICA
  { department: 'SEGURIDAD PUBLICA', area: 'Secretaria', name: 'Darling correa padilla' },
  { department: 'SEGURIDAD PUBLICA', area: 'Secretaria Inspecciones', name: 'Nancy Sánchez' },
  { department: 'SEGURIDAD PUBLICA', area: 'CAVI', name: 'Jose luis caro' },
  { department: 'SEGURIDAD PUBLICA', area: 'Guardia Seguridad pública', name: 'Guardia Seguridad pública' },
  { department: 'SEGURIDAD PUBLICA', area: 'OMEF', name: 'OMEF' },
  { department: 'SEGURIDAD PUBLICA', area: 'Cámaras', name: 'Cecilia Diaz' },
  { department: 'SEGURIDAD PUBLICA', area: 'Central Cámaras', name: 'Cecilia Apaza' },
  { department: 'SEGURIDAD PUBLICA', area: 'Central Cámaras', name: 'Paula Reyes' },

  // EDUCACION (daem)
  { department: 'EDUCACION', area: 'Secretaria', name: 'Elizabeth Jeria' },
  { department: 'EDUCACION', area: 'Encargado de Personal', name: 'Juan Carlos Mateluna' },
  { department: 'EDUCACION', area: 'Encargada de Remuneraciones', name: 'Pamela Ramírez' },

  // SALUD
  { department: 'SALUD', area: 'Secretaria', name: 'Alicia Armijo' },
  { department: 'SALUD', area: 'Salud', name: 'Yanett Esquivel' },
  { department: 'SALUD', area: 'Promoción de la Salud', name: 'Promoción de la Salud' },
  { department: 'SALUD', area: 'Contabilidad', name: 'Daniela Muñoz - Encargada' },
  { department: 'SALUD', area: 'Contabilidad', name: 'Ximena Alvarez' },
  { department: 'SALUD', area: 'Contabilidad', name: 'Rosa Navarro' },
  { department: 'SALUD', area: 'Convenios', name: 'Jonathan Urrutia' },
  { department: 'SALUD', area: 'Convenios', name: 'Daniela Galarce' },
  { department: 'SALUD', area: 'RR.HH. Salud', name: 'RR.HH. Salud' },
  { department: 'SALUD', area: 'Adquisiciones', name: 'Pilar Torres' },
  { department: 'SALUD', area: 'Adquisiciones', name: 'Marcia Maldonado' },

  // JUZGADO POLICIA LOCAL
  { department: 'JUZGADO POLICIA LOCAL', area: 'Mesón Atención de Público 1', name: 'Mesón Atención de Público 1' },
  { department: 'JUZGADO POLICIA LOCAL', area: 'Mesón Atención de Público 2', name: 'Mesón Atención de Público 2' },
  { department: 'JUZGADO POLICIA LOCAL', area: 'Actuarias de Accidente de tránsito', name: 'Actuarias de Accidente de tránsito' },

  // UNION COMUNAL
  { department: 'UNION COMUNAL', area: 'Secretaria', name: 'Karina Aceitón' },

  // CORPORACION DEPORTES
  { department: 'CORPORACION DEPORTES', area: 'Dirección', name: 'Celin Moreno' },
];

export function getDepartmentOptions(): string[] {
  return Array.from(new Set(DEPARTMENTS_DATA.map((d) => d.department))).sort();
}

export function getAreasByDepartment(department: string): string[] {
  return Array.from(new Set(DEPARTMENTS_DATA.filter((d) => d.department === department).map((d) => d.area))).sort();
}

export function getStaffByDepartmentAndArea(department: string, area: string): string[] {
  return DEPARTMENTS_DATA.filter((d) => d.department === department && d.area === area)
    .map((d) => d.name)
    .sort();
}
