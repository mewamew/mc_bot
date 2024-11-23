//制作类工具函数
// 不使用工作台制作指定物品,无返回值
await action.craftItemWithoutCraftingTable('oak_planks', 4);
// 使用工作台制作指定物品,无返回值
await action.craftItemWithCraftingTable('oak_planks', 4);
// 使用熔炉冶炼4个铁矿石，使用1个煤炭
const result = await action.meltItem('iron_ore', 4, 'coal', 1);
if (result) {
    console.log('冶炼成功喵！');
} else {
    console.log('冶炼失败了喵！');
}
