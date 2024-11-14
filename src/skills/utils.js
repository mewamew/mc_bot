class Utils {
    constructor(bot, logger) {
        this.bot = bot;
        this.logger = logger;
        this.mcData = require('minecraft-data')(bot.version);
    }

    async mineBlock(blockType, count) {
        const blockID = this.mcData.blocksByName[blockType]?.id
        if (!blockID) {
            this.logger.report('方块类型错误:' + blockType, this.bot);
            return
        }

        let minedCount = 0
        this.logger.report('开始挖掘 ' + count + ' 个 ' + blockType, this.bot);
        while (minedCount < count) {
            const block = this.bot.findBlock({
                matching: blockID,
                maxDistance: 32
            })

            if (!block) {
                this.logger.report('附近找不到 ' + blockType, this.bot);
                break
            }

            try {
                await this.bot.collectBlock.collect(block)
                minedCount++
                this.logger.report('已经挖了 ' + minedCount + ' 个 ' + blockType, this.bot);
            } catch (err) {
                this.logger.report('挖掘失败:' + err.message, this.bot);
                break
            }
        }

        this.logger.report('任务完成啦！一共挖到了 ' + minedCount + ' 个 ' + blockType, this.bot);
    }

    getItemCount(itemName) {
        const items = this.bot.inventory.items().filter(item => item.name === itemName);
        if (!items.length) return 0;
        return items.reduce((count, item) => count + item.count, 0);
    }

    async craftItemWithoutCraftingTable(itemName, count) {
        const item = this.mcData.itemsByName[itemName];
        if (!item) {
            this.logger.report('找不到物品: ' + itemName, this.bot);
            return;
        }
        const recipe = this.bot.recipesFor(item.id, null, 1, null)[0];
        if (!recipe) {
            this.logger.report('找不到 ' + itemName + ' 的合成配方喵！', this.bot);
            return;
        }

        try {
            let craftedCount = 0;
            while (craftedCount < count) {
                await this.bot.craft(recipe, 1);
                craftedCount += recipe.result.count;
                this.logger.report('已经合成了 ' + craftedCount + ' 个 ' + itemName, this.bot);
            }
            
            this.logger.report('!合成完成啦！一共合成了 ' + craftedCount + ' 个 ' + itemName, this.bot);
        } catch (err) {
            this.logger.report('合成失败了：' + err.message, this.bot);
        }
    }

    async craftItemWithCraftingTable(itemName, count) {
        const { GoalNear } = require('mineflayer-pathfinder').goals;
        const item = this.mcData.itemsByName[itemName];
        if (!item) {
            this.logger.report('找不到物品: ' + itemName, this.bot);
            return;
        }

        const craftingTable = this.bot.findBlock({
            matching: this.mcData.blocksByName.crafting_table.id,
            maxDistance: 32
        });

        if (!craftingTable) {
            this.logger.report('找不到工作台喵！', this.bot);
            return;
        }

        const recipe = this.bot.recipesFor(item.id, null, 1, craftingTable)[0];
        if (!recipe) {
            this.logger.report('找不到 ' + itemName + ' 的合成配方喵！', this.bot);
            return;
        }

        try {
            await this.bot.pathfinder.goto(new GoalNear(craftingTable.position.x, craftingTable.position.y, craftingTable.position.z, 1));
            
            let craftedCount = 0;
            while (craftedCount < count) {
                await this.bot.craft(recipe, 1, craftingTable);
                craftedCount += recipe.result.count;
                this.logger.report('已经合成了 ' + craftedCount + ' 个 ' + itemName, this.bot);
                
                if (craftedCount >= count) break;
            }
            
            this.logger.report('合成完成啦！一共合成了 ' + craftedCount + ' 个 ' + itemName, this.bot);
        } catch (err) {
            this.logger.report('合成失败了喵：' + err.message, this.bot);
            this.logger.error(err);
        }
    }

    async moveTo(position) {
        const { GoalNear } = require('mineflayer-pathfinder').goals;
        await this.bot.pathfinder.goto(new GoalNear(position.x, position.y, position.z, 1));
        this.logger.report('到达目的地: ' + position.x + ' ' + position.y + ' ' + position.z, this.bot);
    }
}

module.exports = Utils;
