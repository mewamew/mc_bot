
//制作指定物品的示例代码
async function craftSomething(bot) {
    const craftingId = mcData.itemsByName['something'].id;
    const recipes = bot.recipesFor(craftingId, null, 1, null);
    if (!recipes || recipes.length === 0) {
        return;
    }
    try {
        await bot.craft(recipes[0], 1)
    } catch (err) {
        logger.error('制作失败:', err)
    }
}
