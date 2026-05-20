import { PrismaClient, MenuType, SpiceLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const hashedPassword = await bcrypt.hash('TastyBites@2024!', 12);
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword, email: 'prabu.pd@gmail.com' },
    create: {
      username: 'admin',
      email: 'prabu.pd@gmail.com',
      password: hashedPassword,
    },
  });
  console.log('✅ Admin user created');

  // Default pickup message
  await prisma.pickupMessage.upsert({
    where: { id: 'default-pickup' },
    update: {
      message: 'Thank you for your order! 🙏 Please pick up your food at Hjortvägen, Älmhult. We will contact you when your order is ready. Payment via Swish to: +46 769677497',
      messageSv: 'Tack för din beställning! 🙏 Hämta din mat på Hjortvägen, Älmhult. Vi kontaktar dig när din beställning är klar. Betalning via Swish till: +46 769677497',
    },
    create: {
      id: 'default-pickup',
      message: 'Thank you for your order! 🙏 Please pick up your food at Hjortvägen, Älmhult. We will contact you when your order is ready. Payment via Swish to: +46 769677497',
      messageSv: 'Tack för din beställning! 🙏 Hämta din mat på Hjortvägen, Älmhult. Vi kontaktar dig när din beställning är klar. Betalning via Swish till: +46 769677497',
      isActive: true,
    },
  });
  console.log('✅ Pickup message created');

  // Default settings
  const defaultSettings = [
    { key: 'SWISH_NUMBER', value: '+46769677497' },
    { key: 'PICKUP_LOCATION', value: 'Hjortvägen, Älmhult, Sweden' },
    { key: 'PICKUP_TIME', value: 'Mon–Sun 09:00–17:00' },
    { key: 'CONTACT_EMAIL', value: 'prabu.pd@gmail.com' },
    { key: 'CONTACT_PHONE', value: '+46769677497' },
    { key: 'WHATSAPP_NUMBER', value: '+46769677497' },
    { key: 'INSTAGRAM_URL', value: 'https://instagram.com/tastybites.se' },
    { key: 'FACEBOOK_URL', value: 'https://facebook.com/tastybites.se' },
    { key: 'SHOW_FRIDAY_MENU', value: 'true' },
    { key: 'SHOW_DAILY_MENU', value: 'true' },
    { key: 'ORDERS_ENABLED', value: 'true' },
    { key: 'APP_URL', value: 'https://tastybites.vercel.app' },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✅ Settings created');

  // ── Dishes ──────────────────────────────────────────────────────────────
  // Delete permanently removed dishes from DB
  await prisma.dish.deleteMany({
    where: { name: { in: ['Garlic Naan', 'Garlic Naan (2 pcs)', 'Gulab Jamun', 'Gulab Jamun (3 pcs)'] } },
  });

  const dishes = [

    // ── DISABLED: items removed from the menu ────────────────────────────
    {
      name: 'Paneer Butter Masala',
      description: 'Creamy tomato-based curry with soft paneer cubes',
      ingredients: 'Paneer, tomatoes, butter, cream, onions, spices',
      ingredientsSv: 'Paneer, tomater, smör, grädde, lök, kryddor',
      price: 100, isVegetarian: true, spiceLevel: SpiceLevel.MILD,
      menuType: MenuType.DAILY, category: 'Curries', isAvailable: false,
    },
    {
      name: 'Paneer Butter Masala with Rice',
      description: 'Creamy tomato-based curry with soft paneer cubes, served with steamed rice',
      ingredients: 'Paneer, tomatoes, butter, cream, onions, ginger, garlic, spices, rice',
      ingredientsSv: 'Paneer, tomater, smör, grädde, lök, ingefära, vitlök, kryddor, ris',
      price: 100, isVegetarian: true, spiceLevel: SpiceLevel.MILD,
      menuType: MenuType.DAILY, category: 'Curries', isAvailable: false,
      imageUrl: '/dishes/paneer-butter-masala.jpg',
    },
    {
      name: 'Dal Makhani',
      description: 'Slow-cooked black lentils in buttery tomato sauce',
      ingredients: 'Black lentils, kidney beans, butter, cream, tomatoes, ginger, garlic, spices',
      ingredientsSv: 'Svarta linser, kidneybönor, smör, grädde, tomater, ingefära, vitlök, kryddor',
      price: 90, isVegetarian: true, spiceLevel: SpiceLevel.MILD,
      menuType: MenuType.DAILY, category: 'Curries', isAvailable: false,
    },
    {
      name: 'Samosa (2 pcs)',
      description: 'Crispy pastry filled with spiced potatoes and peas',
      ingredients: 'Wheat flour, potatoes, green peas, onions, spices',
      ingredientsSv: 'Vetemjöl, potatis, gröna ärtor, lök, kryddor',
      price: 40, isVegetarian: true, spiceLevel: SpiceLevel.MILD,
      menuType: MenuType.DAILY, category: 'Snacks', isAvailable: false,
    },
    {
      name: 'Puffs (Veg & Egg)',
      description: 'Flaky pastry puffs filled with spiced vegetable or egg filling',
      ingredients: 'Puff pastry, potatoes, onions, spices (Veg); Egg, onions, spices (Egg)',
      ingredientsSv: 'Smördeg, potatis, lök, kryddor (Veg); Ägg, lök, kryddor (Ägg)',
      price: 20, isVegetarian: true, spiceLevel: SpiceLevel.MILD,
      menuType: MenuType.BOTH, category: 'Snacks', isAvailable: false,
      imageUrl: '/dishes/puffs.jpg',
    },
    {
      name: 'Hyderabad Mutton Dhum Biriyani',
      description: 'Royal Hyderabadi mutton dum biriyani with tender meat and exotic spices',
      ingredients: 'Basmati rice, mutton, fried onions, yogurt, saffron, rose water, biryani spices',
      ingredientsSv: 'Basmatiris, lamm, stekt lök, yoghurt, saffran, rosenvatten, biryani kryddor',
      price: 130, isVegetarian: false, spiceLevel: SpiceLevel.HOT,
      menuType: MenuType.FRIDAY, category: 'Specialities', isAvailable: false,
      imageUrl: '/dishes/hyderabad-mutton-biriyani.jpg',
    },

    // ── Specialities (BOTH — shown in All Dishes AND Friday Special) ─────
    {
      name: 'Dindigul Chicken Biriyani',
      description: 'Famous Dindigul-style dum biriyani with tender chicken and aromatic spices',
      ingredients: 'Basmati rice, chicken, onions, tomatoes, yogurt, biryani masala, ghee, mint, saffron',
      ingredientsSv: 'Basmatiris, kyckling, lök, tomater, yoghurt, biryani masala, ghee, mynta, saffran',
      price: 100, isVegetarian: false, spiceLevel: SpiceLevel.MEDIUM,
      menuType: MenuType.BOTH, category: 'Specialities', isAvailable: true,
      imageUrl: '/dishes/dindigul-chicken-biriyani.png',
    },
    {
      name: 'Dindigul Veg Biriyani',
      description: 'Fragrant Dindigul-style dum biriyani with fresh vegetables and aromatic spices',
      ingredients: 'Basmati rice, mixed vegetables, onions, tomatoes, yogurt, biryani masala, ghee, mint',
      ingredientsSv: 'Basmatiris, blandade grönsaker, lök, tomater, yoghurt, biryani masala, ghee, mynta',
      price: 85, isVegetarian: true, spiceLevel: SpiceLevel.MILD,
      menuType: MenuType.BOTH, category: 'Specialities', isAvailable: true,
      imageUrl: '/dishes/dindigul-veg-biriyani.png',
    },
    {
      name: 'Dindigul Mutton Biriyani',
      description: 'Rich Dindigul-style mutton biriyani slow-cooked with traditional spices',
      ingredients: 'Basmati rice, mutton, onions, tomatoes, yogurt, biryani masala, ghee, mint',
      ingredientsSv: 'Basmatiris, lamm, lök, tomater, yoghurt, biryani masala, ghee, mynta',
      price: 130, isVegetarian: false, spiceLevel: SpiceLevel.HOT,
      menuType: MenuType.BOTH, category: 'Specialities', isAvailable: true,
      imageUrl: '/dishes/dindigul-mutton-biriyani.jpg',
    },
    {
      name: 'Hyderabad Chicken Dhum Biriyani',
      description: 'Authentic Hyderabadi dum biriyani with juicy chicken and fragrant basmati',
      ingredients: 'Basmati rice, chicken, fried onions, yogurt, saffron, rose water, biryani spices',
      ingredientsSv: 'Basmatiris, kyckling, stekt lök, yoghurt, saffran, rosenvatten, biryani kryddor',
      price: 100, isVegetarian: false, spiceLevel: SpiceLevel.MEDIUM,
      menuType: MenuType.BOTH, category: 'Specialities', isAvailable: true,
      imageUrl: '/dishes/hyderabad-chicken-biriyani.jpg',
    },
    {
      name: 'Hyderabad Lamb Dhum Biriyani',
      description: 'Royal Hyderabadi lamb dum biriyani with tender meat and exotic spices',
      ingredients: 'Basmati rice, lamb, fried onions, yogurt, saffron, rose water, biryani spices',
      ingredientsSv: 'Basmatiris, lamm, stekt lök, yoghurt, saffran, rosenvatten, biryani kryddor',
      price: 130, isVegetarian: false, spiceLevel: SpiceLevel.HOT,
      menuType: MenuType.BOTH, category: 'Specialities', isAvailable: true,
      imageUrl: '/dishes/hyderabad-lamb-biriyani.jpg',
    },
    {
      name: 'Ambur Chicken Biriyani',
      description: 'Classic Ambur-style biriyani with seeraga samba rice and tender chicken',
      ingredients: 'Seeraga samba rice, chicken, onions, tomatoes, yogurt, mint, coriander, biryani spices',
      ingredientsSv: 'Seeraga samba ris, kyckling, lök, tomater, yoghurt, mynta, koriander, biryani kryddor',
      price: 100, isVegetarian: false, spiceLevel: SpiceLevel.MEDIUM,
      menuType: MenuType.BOTH, category: 'Specialities', isAvailable: true,
      imageUrl: '/dishes/ambur-chicken-biriyani.webp',
    },
    {
      name: 'Chicken 65',
      description: 'Crispy deep-fried spiced chicken — a South Indian classic starter',
      ingredients: 'Chicken, yogurt, red chili, ginger, garlic, curry leaves, cornflour, spices',
      ingredientsSv: 'Kyckling, yoghurt, röd chili, ingefära, vitlök, karriblad, majsmjöl, kryddor',
      price: 80, isVegetarian: false, spiceLevel: SpiceLevel.HOT,
      menuType: MenuType.BOTH, category: 'Specialities', isAvailable: true,
      imageUrl: '/dishes/chicken-65.jpg',
    },
    {
      name: 'Chicken Manchurian',
      description: 'Indo-Chinese style crispy chicken tossed in a tangy, spicy Manchurian sauce',
      ingredients: 'Chicken, soy sauce, ginger, garlic, green onions, cornflour, chili sauce',
      ingredientsSv: 'Kyckling, soja, ingefära, vitlök, vårlök, majsmjöl, chilisås',
      price: 80, isVegetarian: false, spiceLevel: SpiceLevel.MEDIUM,
      menuType: MenuType.BOTH, category: 'Specialities', isAvailable: true,
      imageUrl: '/dishes/chicken-manchurian.jpg',
    },
    {
      name: 'Chicken Pakora',
      description: 'Juicy chicken pieces coated in spiced chickpea batter and deep fried',
      ingredients: 'Chicken, chickpea flour, onions, green chili, ginger, garlic, spices',
      ingredientsSv: 'Kyckling, kikärtsmjöl, lök, grön chili, ingefära, vitlök, kryddor',
      price: 80, isVegetarian: false, spiceLevel: SpiceLevel.MEDIUM,
      menuType: MenuType.BOTH, category: 'Specialities', isAvailable: true,
      imageUrl: '/dishes/chicken-pakora.jpg',
    },
    {
      name: 'Gobi 65',
      description: 'Crispy deep-fried spiced cauliflower florets — a popular vegetarian starter',
      ingredients: 'Cauliflower, yogurt, red chili, ginger, garlic, cornflour, curry leaves, spices',
      ingredientsSv: 'Blomkål, yoghurt, röd chili, ingefära, vitlök, majsmjöl, karriblad, kryddor',
      price: 80, isVegetarian: true, spiceLevel: SpiceLevel.MEDIUM,
      menuType: MenuType.BOTH, category: 'Specialities', isAvailable: true,
      imageUrl: '/dishes/gobi-65.jpg',
    },
    {
      name: 'Hot Pepper Chicken',
      description: 'Spicy dry chicken fry with freshly cracked black pepper and aromatic spices',
      ingredients: 'Chicken, black pepper, onions, curry leaves, ginger, garlic, spices',
      ingredientsSv: 'Kyckling, svartpeppar, lök, karriblad, ingefära, vitlök, kryddor',
      price: 80, isVegetarian: false, spiceLevel: SpiceLevel.HOT,
      menuType: MenuType.BOTH, category: 'Specialities', isAvailable: true,
      imageUrl: '/dishes/hot-pepper-chicken.jpg',
    },

    // ── Rice (BOTH) ──────────────────────────────────────────────────────
    {
      name: 'Ghee Rice with Pepper Chicken Gravy',
      description: 'Aromatic ghee rice served with spicy pepper chicken gravy on the side',
      ingredients: 'Basmati rice, ghee, chicken, black pepper, onions, tomatoes, spices',
      ingredientsSv: 'Basmatiris, ghee, kyckling, svartpeppar, lök, tomater, kryddor',
      price: 100, isVegetarian: false, spiceLevel: SpiceLevel.HOT,
      menuType: MenuType.BOTH, category: 'Rice', isAvailable: true,
      imageUrl: '/dishes/ghee-rice-pepper-chicken.jpg',
    },

    // ── Starters & Snacks (BOTH) ─────────────────────────────────────────
    {
      name: 'Chicken Leg Fry',
      description: 'Marinated chicken leg piece fried to golden perfection with spices',
      ingredients: 'Chicken leg, yogurt, red chili, ginger, garlic, garam masala, spices',
      ingredientsSv: 'Kycklingklubba, yoghurt, röd chili, ingefära, vitlök, garam masala, kryddor',
      price: 30, isVegetarian: false, spiceLevel: SpiceLevel.HOT,
      menuType: MenuType.BOTH, category: 'Starters', isAvailable: true,
      imageUrl: '/dishes/chicken-leg-fry.jpg',
    },
    {
      name: 'Veg Puff',
      description: 'Flaky pastry puff filled with spiced potato and vegetable filling',
      ingredients: 'Puff pastry, potatoes, onions, green peas, spices',
      ingredientsSv: 'Smördeg, potatis, lök, gröna ärtor, kryddor',
      price: 20, isVegetarian: true, spiceLevel: SpiceLevel.MILD,
      menuType: MenuType.BOTH, category: 'Snacks', isAvailable: true,
      imageUrl: '/dishes/veg-puff.jpg',
    },
    {
      name: 'Egg Puff',
      description: 'Flaky pastry puff filled with spiced egg and onion filling',
      ingredients: 'Puff pastry, egg, onions, green chili, spices',
      ingredientsSv: 'Smördeg, ägg, lök, grön chili, kryddor',
      price: 20, isVegetarian: false, spiceLevel: SpiceLevel.MILD,
      menuType: MenuType.BOTH, category: 'Snacks', isAvailable: true,
      imageUrl: '/dishes/egg-puff.jpg',
    },

    // ── Curries (DAILY) ──────────────────────────────────────────────────
    {
      name: 'Green Peas Masala with Rice',
      description: 'Hearty green peas cooked in a spiced tomato-onion gravy, served with rice',
      ingredients: 'Green peas, tomatoes, onions, ginger, garlic, cumin, coriander, spices, rice',
      ingredientsSv: 'Gröna ärtor, tomater, lök, ingefära, vitlök, spiskummin, koriander, kryddor, ris',
      price: 100, isVegetarian: true, spiceLevel: SpiceLevel.MEDIUM,
      menuType: MenuType.DAILY, category: 'Curries', isAvailable: true,
      imageUrl: '/dishes/green-peas-masala.jpg',
    },
    {
      name: 'Chicken Tikka Masala with Rice',
      description: 'Tender chicken tikka in a rich, smoky masala sauce, served with steamed rice',
      ingredients: 'Chicken, yogurt, tomatoes, cream, onions, tikka masala spices, rice',
      ingredientsSv: 'Kyckling, yoghurt, tomater, grädde, lök, tikka masala kryddor, ris',
      price: 100, isVegetarian: false, spiceLevel: SpiceLevel.MEDIUM,
      menuType: MenuType.DAILY, category: 'Curries', isAvailable: true,
      imageUrl: '/dishes/chicken-tikka-masala.jpg',
    },
    {
      name: 'Butter Chicken Masala with Rice',
      description: 'Classic mildly spiced butter chicken in creamy tomato sauce, served with rice',
      ingredients: 'Chicken, butter, cream, tomatoes, onions, cashews, spices, rice',
      ingredientsSv: 'Kyckling, smör, grädde, tomater, lök, cashewnötter, kryddor, ris',
      price: 100, isVegetarian: false, spiceLevel: SpiceLevel.MILD,
      menuType: MenuType.DAILY, category: 'Curries', isAvailable: true,
      imageUrl: '/dishes/butter-chicken-masala.jpg',
    },
    {
      name: 'Chettinadu Chicken Masala with Rice',
      description: 'Bold and aromatic Chettinad-style chicken curry with whole spices, with rice',
      ingredients: 'Chicken, onions, tomatoes, Chettinad spices, kalpasi, marathi mokku, rice',
      ingredientsSv: 'Kyckling, lök, tomater, Chettinad kryddor, kalpasi, marathi mokku, ris',
      price: 100, isVegetarian: false, spiceLevel: SpiceLevel.HOT,
      menuType: MenuType.DAILY, category: 'Curries', isAvailable: true,
      imageUrl: '/dishes/chettinad-chicken-masala.jpg',
    },
    {
      name: 'Pepper Chicken Masala with Rice',
      description: 'Fiery pepper chicken cooked with freshly ground black pepper and spices, with rice',
      ingredients: 'Chicken, black pepper, onions, ginger, garlic, curry leaves, spices, rice',
      ingredientsSv: 'Kyckling, svartpeppar, lök, ingefära, vitlök, karriblad, kryddor, ris',
      price: 100, isVegetarian: false, spiceLevel: SpiceLevel.HOT,
      menuType: MenuType.DAILY, category: 'Curries', isAvailable: true,
      imageUrl: '/dishes/pepper-chicken-masala.jpg',
    },
    {
      name: 'Tasty Bites Special Vegetarian Masala with Rice',
      description: 'Our signature mixed vegetable masala curry, served with steamed rice',
      ingredients: 'Mixed vegetables, onions, tomatoes, coconut, spices, rice',
      ingredientsSv: 'Blandade grönsaker, lök, tomater, kokos, kryddor, ris',
      price: 100, isVegetarian: true, spiceLevel: SpiceLevel.MEDIUM,
      menuType: MenuType.DAILY, category: 'Curries', isAvailable: true,
      imageUrl: '/dishes/tastybites-veg-masala.jpg',
    },

    // ── Breakfast (DAILY) ────────────────────────────────────────────────
    {
      name: 'Poori with Potato Masala',
      description: 'Fluffy deep-fried bread served with spiced potato masala — a classic breakfast',
      ingredients: 'Wheat flour, potatoes, onions, mustard seeds, turmeric, ginger, green chili',
      ingredientsSv: 'Vetemjöl, potatis, lök, senapsfrön, gurkmeja, ingefära, grön chili',
      price: 50, isVegetarian: true, spiceLevel: SpiceLevel.MILD,
      menuType: MenuType.DAILY, category: 'Breakfast', isAvailable: true,
      imageUrl: '/dishes/poori-masala.jpg',
    },

    // ── Friday Special only (FRIDAY) ─────────────────────────────────────
    {
      name: 'Vegetable Biriyani',
      description: 'Fragrant basmati rice cooked with fresh vegetables and aromatic spices',
      ingredients: 'Basmati rice, mixed vegetables, onions, tomatoes, yogurt, biryani masala, ghee',
      ingredientsSv: 'Basmatiris, blandade grönsaker, lök, tomater, yoghurt, biryani masala, ghee',
      price: 85, isVegetarian: true, spiceLevel: SpiceLevel.MILD,
      menuType: MenuType.FRIDAY, category: 'Specialities', isAvailable: true,
      imageUrl: '/dishes/veg-biriyani.png',
    },
    {
      name: 'Soft & Fluffy Idlies with Sambar & Chutney',
      description: 'Soft steamed rice cakes served with hot sambar and fresh coconut chutney',
      ingredients: 'Rice, urad dal, lentils, vegetables, coconut, spices',
      ingredientsSv: 'Ris, urad dal, linser, grönsaker, kokos, kryddor',
      price: 50, isVegetarian: true, spiceLevel: SpiceLevel.MILD,
      menuType: MenuType.FRIDAY, category: 'Breakfast', isAvailable: true,
      imageUrl: '/dishes/idli-sambar.jpg',
    },

    // ── Drinks (DAILY) ───────────────────────────────────────────────────
    {
      name: 'Mango Lassi',
      description: 'Refreshing creamy yogurt drink blended with sweet Alphonso mango',
      ingredients: 'Yogurt, mango pulp, sugar, cardamom, milk',
      ingredientsSv: 'Yoghurt, mangopuré, socker, kardemumma, mjölk',
      price: 35, isVegetarian: true, spiceLevel: SpiceLevel.MILD,
      menuType: MenuType.DAILY, category: 'Drinks', isAvailable: true,
      imageUrl: '/dishes/mango-lassi.jpg',
    },
    {
      name: 'Rose Milk',
      description: 'Chilled sweet milk flavoured with fragrant rose syrup',
      ingredients: 'Milk, rose syrup, sugar, ice',
      ingredientsSv: 'Mjölk, rossirap, socker, is',
      price: 20, isVegetarian: true, spiceLevel: SpiceLevel.MILD,
      menuType: MenuType.DAILY, category: 'Drinks', isAvailable: true,
      imageUrl: '/dishes/rose-milk.jpg',
    },
  ];

  for (const dish of dishes) {
    await prisma.dish.upsert({
      where: { name: dish.name },
      update: {
        description: dish.description,
        descriptionSv: (dish as any).descriptionSv ?? '',
        ingredients: dish.ingredients,
        ingredientsSv: dish.ingredientsSv,
        price: dish.price,
        isVegetarian: dish.isVegetarian,
        spiceLevel: dish.spiceLevel,
        menuType: dish.menuType,
        category: dish.category,
        isAvailable: dish.isAvailable,
        imageUrl: dish.imageUrl,
      },
      create: dish,
    });
  }
  console.log(`✅ ${dishes.length} dishes upserted`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
