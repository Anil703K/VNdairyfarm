import image1 from '../images/image1.png';
import image2 from '../images/image2.png';
import image3 from '../images/image3.png';
import butter from '../images/butter.png';
import icecream from '../images/icecream.png';
import milkpowder from '../images/milkpowder.png';
import condensed from '../images/condensed.png';
import cream from '../images/cream.png';
import flavoredmilk from '../images/flavoredmilk.png';
import snacks from '../images/snacks.png';
import organic from '../images/organic.png';
import yogurt from '../images/yogurt.png';
import paneer from '../images/paneer.png';
import ghee from '../images/ghee.png';
import buttermilk from '../images/buttermilk.png';
import cowmilk from '../images/cowmilk.png';
import buffalomilk from '../images/buffalomilk.png';

const imageMap = {
  'image1.png': image1,
  'image2.png': image2,
  'image3.png': image3,
  'butter.png': butter,
  'icecream.png': icecream,
  'milkpowder.png': milkpowder,
  'condensed.png': condensed,
  'cream.png': cream,
  'flavoredmilk.png': flavoredmilk,
  'snacks.png': snacks,
  'organic.png': organic,
  'yogurt.png': yogurt,
  'paneer.png': paneer,
  'ghee.png': ghee,
  'buttermilk.png': buttermilk,
  'cowmilk.png': cowmilk,
  'buffalomilk.png': buffalomilk,
};

export const resolveProductImage = (imagePath) => {
  if (!imagePath) return undefined;
  const filename = String(imagePath).split(/[/\\]/).pop().toLowerCase();
  return imageMap[filename] || imageMap[filename.replace(/^\.\//, '')];
};

export default resolveProductImage;
