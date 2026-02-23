export default async function traverseDirectory(entry:FileSystemDirectoryEntry):Promise<File[]>{
const files:File[]= [];
const reader = entry.createReader();
const entries =await new Promise<FileSystemEntry[]>((resolve,reject)=>{
    reader.readEntries((entries)=>resolve(entries),reject);
});
for(const ent of entries){
    if(ent.isFile){
        const fileEntry = ent as FileSystemFileEntry;
        const file = await new Promise<File>((resolve,reject)=>{
            fileEntry.file(resolve,reject)
        });
        files.push(file);
    }else if(ent.isDirectory){
        const directory = ent as FileSystemDirectoryEntry;
        const subFiles = await traverseDirectory(directory);
        files.push(...subFiles)
    }
    }
    return files;
}