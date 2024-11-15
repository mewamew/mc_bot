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

    async findPlacePosition() {
        const { Vec3 } = require('vec3');
        
        // 获取机器人当前位置
        const botPos = this.bot.entity.position;
        
        // 搜索附近的实心方块
        const blocks = this.bot.findBlocks({
            matching: (block) => block.boundingBox === 'block',
            maxDistance: 3,
            count: 256
        });

        // 按照距离排序
        blocks.sort((a, b) => {
            const distA = a.distanceTo(botPos);
            const distB = b.distanceTo(botPos);
            return distA - distB;
        });

        // 遍历找到的方块，检查其上方是否有合适的放置位置
        for (const blockPos of blocks) {
            const block = this.bot.blockAt(blockPos);
            const targetPos = blockPos.offset(0, 1, 0);
            const targetBlock = this.bot.blockAt(targetPos);
            
            // 检查目标位置是否有实体
            const entities = this.bot.entities;
            const isEntityAtTarget = Object.values(entities).some(entity => {
                const entityPos = entity.position;
                return Math.floor(entityPos.x) === targetPos.x &&
                       Math.floor(entityPos.y) === targetPos.y &&
                       Math.floor(entityPos.z) === targetPos.z;
            });

            // 检查：
            // 1. 目标位置是空的
            // 2. 机器人可以看到这个方块
            // 3. 目标位置没有实体
            if ((!targetBlock || targetBlock.boundingBox === 'empty') && 
                this.bot.canSeeBlock(block) &&
                !isEntityAtTarget) {
                this.logger.report('找到可放置位置的参考方块: ' + block.position.x + ' ' + block.position.y + ' ' + block.position.z, this.bot);
                return block;
            }
        }

        this.logger.report('找不到合适的放置位置喵！', this.bot);
        return null;
    }

    async placeBlock(itemName, count = 1) {
        const Vec3 = require('vec3');
        const item = this.bot.inventory.findInventoryItem(itemName);
        
        if (!item) {
            this.logger.report('找不到物品: ' + itemName, this.bot);
            return;
        }

        let placedCount = 0;
        while (placedCount < count) {
            try {
                await this.bot.equip(item, 'hand');
                
                // 寻找可放置位置
                const targetBlock = await this.findPlacePosition();
                if (!targetBlock) {
                    this.logger.report('找不到可以放置的地方', this.bot);
                    return;
                }
                
                // 创建一个新的 Vec3 实例来指定放置方向
                const faceVector = new Vec3(0, 1, 0);
                this.logger.info(faceVector);
                this.logger.error(targetBlock);
                await this.bot.placeBlock(targetBlock, faceVector);
                placedCount++;
                
                this.logger.report('已放置 ' + placedCount + ' 个 ' + itemName, this.bot);
            } catch (err) {
                this.logger.report('放置失败: ' + err.message, this.bot);
                this.logger.error(err);
                return;
            }
        }

        this.logger.report('放置完成！共放置了 ' + placedCount + ' 个 ' + itemName, this.bot);
    }
}

module.exports = Utils;
