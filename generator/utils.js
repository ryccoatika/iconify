import { exit } from 'process';
import { promises as fs } from 'fs';
import { cleanupSVG, IconSet, isEmptyColor, parseColors, runSVGO } from '@iconify/tools';

const Utils = {
    checkIconSets: async (folder) => {
        try {
            await fs.stat(folder);
        } catch (_) {
            console.log(`${folder} not found`);
            console.log('please run $npm run fetch-iconsets');
            exit(-1);
        }
    },
    checkFolderAndRecreate: async (folder) => {
        try {
            const files = await fs.readdir(folder);

            if (files.length !== 0) {
                console.log(`${folder} is already generated`);

                console.log(`${folder} will be deleted and recreated`);
                await fs.rm(folder, { recursive: true })
                await fs.mkdir(folder, { recursive: true })
            }
        } catch (_) {
            fs.mkdir(folder, { recursive: true });
            console.log(`${folder} is created!`);
        }
    },
    fetchAllIconSetsSvg: async (folder) => {
        var iconify = [];
        const iconsetsFilenames = await fs.readdir(folder);
        for (const iconsetsFilename of iconsetsFilenames) {
            var iconsetVariant = {};

            const variantName = iconsetsFilename.split(".")[0];
            iconsetVariant.name = variantName;

            const iconsetsContent = await fs.readFile(`${folder}/${iconsetsFilename}`);
            const iconset = new IconSet(JSON.parse(iconsetsContent));

            // clean up
            await iconset.forEachSync(async (name, type) => {
                if (type !== 'icon') {
                    console.error(`iconset with type ${type} is skipped`);
                    return;
                }

                const svg = iconset.toSVG(name);
                if (!svg) {
                    console.error(`iconset "${name}" unable to get svg`);
                    iconset.remove(name);
                    return;
                }

                try {
                    await cleanupSVG(svg);
                    await parseColors(svg, {
                        callback: (_, colorStr, color) => {
                            return !color || !isEmptyColor(color) ? colorStr : 'currentColor';
                        },
                    });

                    await runSVGO(svg);
                } catch (err) {
                    console.error(`unable to parse iconset "${name}"`, err);
                    iconset.remove(name);
                    return;
                }

                iconset.fromSVG(name, svg);
            });

            // export iconset
            var iconsets = [];
            await iconset.forEachSync(async (name, _) => {
                const svg = iconset.toString(name).replaceAll("currentColor", "#000000");

                if (svg) {
                    iconsets.push(
                        {
                            'name': name,
                            'svg': svg,
                        }
                    );
                }
            })
            iconsetVariant.icons = iconsets;
            iconify.push(iconsetVariant);
        }

        return iconify;
    },
    saveSVGFile: async (filename, content) => {
        await fs.appendFile(filename, content);
    }
}

export default Utils