const Vec3 = require('vec3');
const { goals: { Goal, GoalNear, GoalBlock}, Pathfinder } = require('mineflayer-pathfinder');

class Utils {
    constructor(bot, logger) {
        this.bot = bot;
        this.logger = logger;
        this.mcData = require('minecraft-data')(bot.version);

    }

    async mineBlock(blockType, count, maxDistance = 4) {
        const blockID = this.mcData.blocksByName[blockType]?.id
        if (!blockID) {
            this.logger.report('方块类型错误:' + blockType, this.bot);
            return
        }

        // 确定要统计的物品名称
        const countItemName = blockType === 'coal_ore' ? 'coal' : blockType
        
        let minedCount = 0
        this.logger.report('开始挖掘，目标是挖到 ' + count + ' 个 ' + countItemName, this.bot);

        while (minedCount < count) {
            // 找到所有符合条件的方块
            const blocks = this.bot.findBlocks({
                matching: blockID,
                maxDistance: maxDistance,
                count: 10  // 一次找10个，避免搜索太多
            })

            if (!blocks || blocks.length === 0) {
                this.logger.report('附近找不到 ' + blockType, this.bot);
                break
            }

            // 按照直线距离排序
            const botPos = this.bot.entity.position
            blocks.sort((a, b) => {
                const distA = botPos.distanceTo(a)
                const distB = botPos.distanceTo(b)
                return distA - distB
            })

            // 尝试挖掘最近的方块
            let success = false
            for (const blockPos of blocks) {
                const block = this.bot.blockAt(blockPos)
                if (!block) continue

                try {
                    await this.digPath(block.position)
                    
                    // 记录收集前的数量
                    const beforeCount = this.getItemCount(countItemName)
                    await this.bot.collectBlock.collect(block)
                    await this.bot.waitForTicks(10)
                    
                    // 检查收集后的数量
                    const afterCount = this.getItemCount(countItemName)
                    const collectedAmount = afterCount - beforeCount
                    
                    if (collectedAmount > 0) {
                        minedCount += collectedAmount
                        this.logger.report('新挖到了 ' + collectedAmount + ' 个 ' + countItemName + '，总共已经挖到 ' + minedCount + ' 个', this.bot);
                        success = true
                        break
                    }
                } catch (err) {
                    this.logger.report('尝试挖掘失败，尝试下一个目标: ' + err.message, this.bot);
                    continue
                }
            }

            if (!success) {
                this.logger.report('所有尝试都失败了，等待一会儿再继续', this.bot);
                await this.bot.waitForTicks(20)
            }
        }

        this.logger.report('挖掘任务完成啦！一共挖到了 ' + minedCount + ' 个 ' + countItemName, this.bot);
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
        await this.bot.pathfinder.goto(new GoalNear(position.x, position.y, position.z, 1));
        this.logger.report('到达目的地: ' + position.x + ' ' + position.y + ' ' + position.z, this.bot);
    }

    async findPlacePosition() {
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
            // 1. 目标置是空的
            // 2. 机器人可以看到这个方块
            // 3. 目标位置没实体
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

    // 添加新方法：挖一条到目标位置的通道
    async digPath(targetPos) {
        // 创建一个自定义寻路目标，确保机器人能接触到目标方块
        class GoalNearBlock extends Goal {
            constructor(x, y, z) {
                super()
                this.x = Math.floor(x)
                this.y = Math.floor(y)
                this.z = Math.floor(z)
            }

            heuristic(node) {
                const dx = this.x - node.x
                const dy = this.y - node.y
                const dz = this.z - node.z
                return Math.sqrt(dx * dx + dy * dy + dz * dz)
            }

            isEnd(node) {
                return this.heuristic(node) < 2
            }
        }

        // 尝试寻路到目标位置
        try {
            await this.bot.pathfinder.goto(new GoalNearBlock(targetPos.x, targetPos.y, targetPos.z))
        } catch (err) {
            // 如果无法直接寻路，就挖一条通道
            const currentPos = this.bot.entity.position
            const blocks = this.bot.world.raycast(currentPos, targetPos, 10)
            
            if (!blocks) return
            
            // 挖掉路径上的所有方块
            for (const block of blocks) {
                if (block.type !== 0) { // 不是空气
                    try {
                        await this.bot.dig(block)
                        await this.bot.waitForTicks(5)
                    } catch (err) {
                        continue
                    }
                }
            }
        }
    }


    async equipPickaxe() {
        // 按照工具等级排序
        const pickaxeTypes = ['netherite_pickaxe', 'diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'wooden_pickaxe'];
        
        // 查找背包中最好的镐
        let bestPickaxe = null;
        for (const pickType of pickaxeTypes) {
            bestPickaxe = this.bot.inventory.findInventoryItem(pickType);
            if (bestPickaxe) break;
        }

        if (!bestPickaxe) {
            this.logger.report('找不到任何镐子', this.bot);
            return;
        }

        await this.bot.equip(bestPickaxe, 'hand');
        this.logger.report('装备了 ' + bestPickaxe.name, this.bot);
    }

    async returnToGround() {
        await this.equipPickaxe();
        
        // 检查当前是否已在地面
        const isAtSurface = () => {
            const pos = this.bot.entity.position
            
            // 检查头顶10格是否通畅
            for (let y = 1; y <= 10; y++) {
                const block = this.bot.blockAt(pos.offset(0, y, 0))
                if (!block || block.name !== 'air') return false
            }
            
            // 检查周围2格范围是否开阔(检查2层高度)
            for (let y = 0; y <= 1; y++) {
                for (let x = -2; x <= 2; x++) {
                    for (let z = -2; z <= 2; z++) {
                        const block = this.bot.blockAt(pos.offset(x, y, z))
                        if (!block || block.name !== 'air') return false
                    }
                }
            }
            
            return true
        }

        // 如果已经在地面就直接返回
        if (isAtSurface()) {
            this.logger.report('已经在地面上了！', this.bot)
            return
        }

        this.logger.report('开始寻找返回地面的路径...', this.bot)
        
        // 向上挖掘直到找到地面
        let steps = 0
        const maxSteps = 100 // 防止无限循环
        
        while (!isAtSurface() && steps < maxSteps) {
            const pos = this.bot.entity.position

            // 寻找前方的实心方块
            let targetBlock = null
            for (let i = 1; i <= 3; i++) {
                const checkBlock = this.bot.blockAt(pos.offset(0, 1, i))
                if (checkBlock && checkBlock.boundingBox === 'block') {
                    targetBlock = pos.offset(0, 1, i)
                    break
                }
            }

            // 如果找不到实心方块，就继续向前移动一格
            if (!targetBlock) {
                targetBlock = pos.offset(0, 1, 1)
            }

            // 检查并挖掘通道
            const block1 = this.bot.blockAt(pos.offset(0, 1, 1))
            const block2 = this.bot.blockAt(pos.offset(0, 2, 1))
            const block3 = this.bot.blockAt(pos.offset(0, 2, 0))

            // 挖掉前方上方的两个方块以确保通道
            if (block1 && block1.name !== 'air') {
                await this.bot.dig(block1)
            }
            if (block2 && block2.name !== 'air') {
                await this.bot.dig(block2)
            }

            if (block3 && block3.name !== 'air') {
                await this.bot.dig(block3)
            }

            // 移动到新的位置
            await this.bot.pathfinder.goto(new GoalBlock(targetBlock.x, targetBlock.y, targetBlock.z))
            
            steps++
            if (steps % 5 === 0) {
                this.logger.report(`已经向上挖掘了 ${steps} 格...`, this.bot)
            }
        }

        if (steps >= maxSteps) {
            this.logger.report('无法找到地面，可能距离太远了！', this.bot)
            return
        }

        this.logger.report('成功返回地面！', this.bot)
    }

}

module.exports = Utils;
