import fs from "fs/promises"; // ← use promises API
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { slugify } from "../../utils/slugify";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export const saveFileFromMemory = async (
  file: Express.Multer.File,
  folder = ""
): Promise<string> => {
  if (!file) throw new Error("No file provided");

  const folderPath = folder ? path.join(UPLOAD_ROOT, folder) : UPLOAD_ROOT;
  await fs.mkdir(folderPath, { recursive: true });

  const ext = path.extname(file.originalname);
  const baseName = slugify(path.basename(file.originalname, ext));
  const uniqueName = `${baseName}-${uuidv4()}${ext}`;

  const filePath = path.join(folderPath, uniqueName);
  await fs.writeFile(filePath, file.buffer); // async write

  const fileUrl = `${process.env.BASE_URL || "http://localhost:7000"}/uploads${
    folder ? "/" + folder : ""
  }/${uniqueName}`;

  return fileUrl;
};

export const saveMultipleFilesFromMemory = async (
  files: Express.Multer.File[],
  folder = ""
): Promise<string[]> => {
  return Promise.all(files.map((file) => saveFileFromMemory(file, folder)));
};
