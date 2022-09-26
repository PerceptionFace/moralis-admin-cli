
# Moralis Admin CLI version for CI/CD

## Repositorio de Moralis modificado para agregarlo a flujo de CI/CD.

Se ejecuta el siguiente comando:
npx moralis-admin-cli watch-cloud-folder --moralisApiKey $API_KEY --moralisApiSecret $API_SECRET --moralisSubdomain 7nmv6t4fk1od.usemoralis.com --autoSave 2 --moralisCloudfolder  ./MoralisCloudFunctions/cloud

Modificaciones:
-watchCloudFolder: agregamos una nueva opcion de autoSave para que el programa termine su ejecucion luego de actualizar y subir los archivos modificados a la nube.
opcion agregada: 2. (ejemplo: --autoSave 2).
