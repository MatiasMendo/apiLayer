# API REST LAYER Module


----
# API Definition

## **/ingestor/v1/new**
 Inserta una nueva ejecución para procesamiento y descarga de audios por parte del **Ingestor**.
* **Method:**
  `POST`
* **Data Params Required:**
  * tenant_id: String
  * audios: Array[]
  * **Element Definition:** audios Array[]:
    * source: String    //Ruta completa para la descarga del audio
    * duration: Numeric  //Duración del audio en segundos
    * metadata: String   //Metada que es traspasada SIN CAMBIO hacia el transcriptor   
  * **Element Definition:** metadata: JSON String [Metadata JSON SCHEMA](VOC-Metadata.schema.json)
* **Success Response:**
  * **Code:** 200 <br />
    * tenant_id: String
    * job_id : String  //Job que identifica esta ejecución
    * amount: Numeric //Cantidad de audios insertados


## **/ingestor/v1/new**
 Agrega nuevos audios a una ejecución previa, para procesamiento y descarga de audios por parte del **Ingestor**.
* **Method:**
  `PATCH`
* **Data Params Required:**
  * tenant_id: String
  * job_id: String //job_id de la ejecución al cual agregar nuevos audios
  * audios: Array[]
  * **Element Definition:** audios Array[]: 
    * source: String    //Ruta completa para la descarga del audio
    * duration: Numeric  //Duración del audio en segundos
    * metadata: String   //Metada que es traspasada SIN CAMBIO hacia el transcriptor
  * **Element Definition:** metadata: JSON String [Metadata JSON SCHEMA](VOC-Metadata.schema.json)
* **Success Response:**
  * **Code:** 200 <br />
    * tenant_id: String
    * job_id : String  //Job que identifica esta ejecución
    * amount: Numeric //Cantidad de audios insertado


## **/ingestor/v1/job**
 Obtiene un listado de nuevos audios para su procesamiento desde el módulo INPUT del **Ingestor**.
* **Method:**
  `GET`
* **Data Params Required:**
  * tenant_id: String
  * limit: Numeric //Número máximo de audios a obtener en esta iteración de consulta
* **Success Response:**
  * **Code:** 200 <br />
    * audios : Array[]  //Listado de audios a procesar
    * **Element Definition:** audios Array[]: 
      * tenant_id: String
      * job_id: String //Id de la ejecución a la cual pertenece este audio
      * source: String    //Ruta completa para la descarga del audio
      * duration: Numeric  //Duración del audio en segundos
      * file_id: String   //Nombre e identificador que deberá tener el archivo durante el proceso de ingestión (no incluye la extensión)
      * type: String // "AUDIO" | "TEXT" (para canales digitales)


## **/ingestor/v1/job/stats**
 Extrae las estadísticas de un JOB determinado.
* **Method:**
  `GET`
* **Data Params Required:**
  * tenant_id: String
  * job_id: String
* **Success Response:**
  * **Code:** 200 <br />
    * duration: Numeric  //Segundos de audios que han sido subidos correctamente por este job al momento de la consulta
    * files:
      * total: Numeric // Número de archivos incluidos en este job
      * processing: Numeric //Número de archivos que están en proceso
      * done: Numeric //Número de archivos ya procesados correctamente
      * error: Numeric    //Número de archivos ya procesados pero con error   


## **/ingestor/v1/metadata**
 Extrae la metadata para un archivo determinado.
* **Method:**
  `GET`
* **Data Params Required:**
  * tenant_id: String
  * file_id: String
* **Success Response:**
  * **Code:** 200 <br />
    * metadata : String  //String con el contenido de la metada del audio consultado
    * file_id: String   //Nombre e identificador que deberá tener el archivo durante el proceso de ingestión (no incluye la extensión)

    
## **/ingestor/v1/input/state**
 Indica y registra TODOS los cambios de estado en el procesamiento de cada archivo por el microservicio INPUT
* **Method:**
  `PATCH`
* **Data Params Required:**
  * tenant_id: String
  * file_id: String
  * state: "STARTING | FINISHED | ERROR | BAD_FILE"
* **Success Response:**
  * **Code:** 200 <br />


## **/ingestor/v1/converter/state**
 Indica y registra TODOS los cambios de estado en el procesamiento de cada archivo por el microservicio CONVERTER
* **Method:**
  `PATCH`
* **Data Params Required: **
  * tenant_id: String
  * file_id: String
  * state: "STARTING | FINISHED | ERROR | BAD_FILE"
* **Success Response:**
  * **Code:** 200 <br />

    
## **/ingestor/v1/zipper/state**
 Indica y registra TODOS los cambios de estado en el procesamiento de cada archivo por el microservicio ZIPPER
* **Method:**
  `PATCH`
* **Data Params Required: **
  * tenant_id: String
  * file_id: String
  * state: "STARTING | FINISHED | ERROR | BAD_FILE"
* **Success Response:**
  * **Code:** 200 <br />


    
## **/ingestor/v1/uploader/state**
 Indica y registra TODOS los cambios de estado en el procesamiento de cada archivo por el microservicio UPLOADER
* **Method:**
  `PATCH`
* **Data Params Required: **
  * tenant_id: String
  * file_id: String
  * state: "STARTING | FINISHED | ERROR | BAD_FILE"
* **Success Response:**
  * **Code:** 200 <br />

