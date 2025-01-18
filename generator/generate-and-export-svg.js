import Utils from './utils.js';
import Const from './const.js';

(async () => {

  await Utils.checkIconSets(Const.iconsetsFolder);
  await Utils.checkFolderAndRecreate(Const.svgGeneratedFolder);

  const iconsets = await Utils.fetchAllIconSetsSvg(Const.iconsetsFolder);

  for (const iconset of iconsets) {
    for (const icon of iconset.icons) {
      const iconsetname = iconset.name.split("-").join("_");
      const iconname = icon.name.split("-").join("_");
      const filename = `${Const.svgGeneratedFolder}/${iconsetname}_${iconname}.svg`;
      console.log(filename);
      await Utils.saveSVGFile(filename, icon.svg);
    }
  }
})();
