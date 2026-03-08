"""Management cog for adding products, sellers, staff, etc."""

import base64
import discord
from discord import app_commands
from discord.ext import commands
import json
import os
from datetime import datetime
from utils.embeds import branded_embed, success_embed, warning_embed, setup_banner
from utils.permissions import (
    staff_or_higher, admin_or_higher,
    is_dev
)
import config


class ManagementCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.products = []
        self.sellers = []
        self.staff = []
        self.coupons = []
        self.load_data()

    def load_data(self):
        try:
            if os.path.exists(config.PRODUCTS_FILE):
                with open(config.PRODUCTS_FILE, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if not content:
                        self.products = []
                    elif content.startswith('['):
                        self.products = json.loads(content)
                    else:
                        self.products = json.loads('[' + content + ']')
            else:
                self.products = []
        except Exception as e:
            print(f"Error loading products: {e}")
            self.products = []

        try:
            if os.path.exists(config.SELLERS_FILE):
                with open(config.SELLERS_FILE, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if not content:
                        self.sellers = []
                    elif content.startswith('['):
                        self.sellers = json.loads(content)
                    else:
                        self.sellers = json.loads('[' + content + ']')
            else:
                self.sellers = []
        except Exception as e:
            print(f"Error loading sellers: {e}")
            self.sellers = []

        self._load_staff()

        coupons_file = getattr(config, 'COUPONS_FILE', 'data/coupons.json')
        try:
            if os.path.exists(coupons_file):
                with open(coupons_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    self.coupons = json.loads(content) if content else []
            else:
                self.coupons = [{
                    'id': 'c_default',
                    'enabled': True,
                    'title': 'Welcome to TAROFINDS!',
                    'message': 'Use the invite code below to register and start ordering.',
                    'code': 'TAROFINDS',
                    'url': 'https://m.litbuy.com/pages/register/index?inviteCode=TAROFINDS',
                    'button': 'Register Now'
                }]
                self.save_coupons()
        except Exception as e:
            print(f"Error loading coupons: {e}")
            self.coupons = []

    def _load_staff(self):
        staff_file = config.STAFF_FILE
        if os.path.exists(staff_file):
            try:
                with open(staff_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    self.staff = json.loads(content) if content else []
            except Exception as e:
                print(f"Error loading staff: {e}")
                self.staff = []
        else:
            self.staff = []
            owner_id = str(getattr(config, 'OWNER_USER_ID', '')).strip()
            dev_id = str(getattr(config, 'DEV_USER_ID', '')).strip()

            if owner_id and owner_id != '0':
                self.staff.append({
                    'id': 'owner',
                    'discord_id': owner_id,
                    'role': 'owner',
                    'username': 'owner',
                    'invite_only': True,
                    'added_at': datetime.now().isoformat()
                })

            if dev_id and dev_id != '0' and dev_id != owner_id:
                self.staff.append({
                    'id': 'dev',
                    'discord_id': dev_id,
                    'role': 'dev',
                    'username': 'dev',
                    'invite_only': True,
                    'added_at': datetime.now().isoformat()
                })

            self.save_staff()

    def _is_owner_or_dev(self, discord_id: str) -> bool:
        owner_id = str(getattr(config, 'OWNER_USER_ID', '')).strip()
        dev_id = str(getattr(config, 'DEV_USER_ID', '')).strip()
        return discord_id in (owner_id, dev_id)

    def save_products(self):
        try:
            dirpath = os.path.dirname(config.PRODUCTS_FILE)
            if dirpath:
                os.makedirs(dirpath, exist_ok=True)
            with open(config.PRODUCTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.products, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving products: {e}")
            return False

    def save_sellers(self):
        try:
            dirpath = os.path.dirname(config.SELLERS_FILE)
            if dirpath:
                os.makedirs(dirpath, exist_ok=True)
            with open(config.SELLERS_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.sellers, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving sellers: {e}")
            return False

    def save_staff(self):
        try:
            os.makedirs(os.path.dirname(config.STAFF_FILE) or 'data', exist_ok=True)
            with open(config.STAFF_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.staff, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving staff: {e}")
            return False

    def save_coupons(self):
        coupons_file = getattr(config, 'COUPONS_FILE', 'data/coupons.json')
        try:
            os.makedirs(os.path.dirname(coupons_file) or 'data', exist_ok=True)
            with open(coupons_file, 'w', encoding='utf-8') as f:
                json.dump(self.coupons, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving coupons: {e}")
            return False

    def _make_admin_invite_link(self, discord_id: str, role: str, invited_by: str) -> str:
        payload = {
            'discord_id': str(discord_id),
            'role': str(role).lower(),
            'invited_by': str(invited_by),
            'issued_at': datetime.utcnow().isoformat()
        }
        raw = json.dumps(payload, separators=(',', ':')).encode('utf-8')
        token = base64.urlsafe_b64encode(raw).decode('utf-8').rstrip('=')
        site_url = getattr(config, 'SITE_URL', 'https://tarofinds.com').rstrip('/')
        return f"{site_url}/admin.html?invite={token}"

    @app_commands.command(name="addproduct", description="Add a new product to the catalog (staff+)")
    @app_commands.describe(
        name="Product name", category="Product category", price="Price in CNY",
        seller="Seller name", link="Product link", image="Image URL"
    )
    @app_commands.choices(category=[
        app_commands.Choice(name="Shoes", value="shoes"),
        app_commands.Choice(name="Clothes", value="clothes"),
        app_commands.Choice(name="Accessories", value="accessories"),
        app_commands.Choice(name="Electronics", value="electronics"),
        app_commands.Choice(name="Hoodies", value="hoodies"),
        app_commands.Choice(name="Jackets", value="jackets"),
        app_commands.Choice(name="T-Shirts", value="t-shirts"),
        app_commands.Choice(name="Shorts", value="shorts"),
        app_commands.Choice(name="Bags", value="bags"),
        app_commands.Choice(name="Watches", value="watches"),
        app_commands.Choice(name="Jewelry", value="jewelry"),
    ])
    @staff_or_higher()
    async def addproduct(self, interaction: discord.Interaction, name: str, category: str,
                         price: float, seller: str = "Unknown", link: str = "#", image: str = ""):
        new_product = {
            'id': f'p{int(datetime.now().timestamp() * 1000)}',
            'name': name,
            'category': category,
            'price': price,
            'seller': seller,
            'link': link if link.startswith('http') else '#',
            'image': image if image.startswith('http') else '',
            'featured': False,
            'qc': False,
            'qcImages': [],
            'dateAdded': datetime.now().strftime('%Y-%m-%d')
        }
        self.products.insert(0, new_product)

        if self.save_products():
            embed = success_embed("Product Added", f"**{name}** has been added to the catalog.")
            embed.add_field(name="Category", value=category, inline=True)
            embed.add_field(name="Price", value=f"¥{price}", inline=True)
            embed.add_field(name="Seller", value=seller, inline=True)
            embed.add_field(name="ID", value=new_product['id'], inline=False)
            file = setup_banner(embed)
            if file:
                await interaction.response.send_message(embed=embed, file=file, ephemeral=True)
            else:
                await interaction.response.send_message(embed=embed, ephemeral=True)
        else:
            await interaction.response.send_message("❌ Failed to save product.", ephemeral=True)

    @app_commands.command(name="deleteproduct", description="Delete a product by name (admin+)")
    @app_commands.describe(name="Product name (partial match works)")
    @admin_or_higher()
    async def deleteproduct(self, interaction: discord.Interaction, name: str):
        matches = [p for p in self.products if name.lower() in p.get('name', '').lower()]
        if not matches:
            return await interaction.response.send_message(f"❌ No products found matching **{name}**.", ephemeral=True)
        if len(matches) > 1:
            embed = warning_embed("Multiple Matches", "\n".join([f"• {p['name']}" for p in matches[:5]]) + "\n\nBe more specific.")
            return await interaction.response.send_message(embed=embed, ephemeral=True)

        product = matches[0]
        self.products = [p for p in self.products if p['id'] != product['id']]
        if self.save_products():
            embed = success_embed("Product Deleted", f"**{product['name']}** removed.")
            await interaction.response.send_message(embed=embed, ephemeral=True)
        else:
            await interaction.response.send_message("❌ Failed to delete.", ephemeral=True)

    @app_commands.command(name="listproducts", description="List recent products (staff+)")
    @app_commands.describe(limit="Number to show (1-20)")
    @staff_or_higher()
    async def listproducts(self, interaction: discord.Interaction, limit: int = 5):
        limit = max(1, min(20, limit))
        recent = self.products[:limit]
        if not recent:
            return await interaction.response.send_message("❌ No products found.", ephemeral=True)

        embed = branded_embed(f"📦 Recent Products ({len(recent)} shown)", "")
        for p in recent:
            embed.add_field(name=p.get('name', '?')[:50], value=f"¥{p.get('price', '?')} · {p.get('category', '?')} · {p.get('seller', '?')}", inline=False)
        embed.set_footer(text=f"Total: {len(self.products)}")
        file = setup_banner(embed)
        if file:
            await interaction.response.send_message(embed=embed, file=file, ephemeral=True)
        else:
            await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="addseller", description="Add a new seller (staff+)")
    @app_commands.describe(name="Seller name", link="Store link", description="Short description", logo="Logo URL", verified="Verified?")
    @staff_or_higher()
    async def addseller(self, interaction: discord.Interaction, name: str, link: str,
                        description: str = "", logo: str = "", verified: bool = True):
        new_seller = {
            'id': f's{int(datetime.now().timestamp() * 1000)}',
            'name': name,
            'link': link if link.startswith('http') else '#',
            'description': description,
            'logo': logo if logo.startswith('http') else '',
            'verified': verified,
            'dateAdded': datetime.now().strftime('%Y-%m-%d')
        }
        self.sellers.insert(0, new_seller)
        if self.save_sellers():
            embed = success_embed("Seller Added", f"**{name}** added to sellers list.")
            embed.add_field(name="Link", value=link, inline=False)
            embed.add_field(name="Verified", value="✅" if verified else "⏳", inline=True)
            file = setup_banner(embed)
            if file:
                await interaction.response.send_message(embed=embed, file=file, ephemeral=True)
            else:
                await interaction.response.send_message(embed=embed, ephemeral=True)
        else:
            await interaction.response.send_message("❌ Failed to save seller.", ephemeral=True)

    @app_commands.command(name="listsellers", description="List all sellers (staff+)")
    @staff_or_higher()
    async def listsellers(self, interaction: discord.Interaction):
        if not self.sellers:
            return await interaction.response.send_message("❌ No sellers found.", ephemeral=True)
        embed = branded_embed(f"🏪 Sellers ({len(self.sellers)} total)", "")
        for s in self.sellers[:20]:
            embed.add_field(name=f"{'✅' if s.get('verified') else '❌'} {s.get('name', '?')}", value=f"[Visit Store]({s.get('link', '#')})", inline=False)
        if len(self.sellers) > 20:
            embed.set_footer(text=f"Showing 20 of {len(self.sellers)}")
        file = setup_banner(embed)
        if file:
            await interaction.response.send_message(embed=embed, file=file, ephemeral=True)
        else:
            await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="addstaff", description="Invite a staff member to create an admin login")
    @app_commands.describe(user="Discord user", role="Staff role")
    @app_commands.choices(role=[
        app_commands.Choice(name="Staff", value="staff"),
        app_commands.Choice(name="Moderator", value="moderator"),
        app_commands.Choice(name="Admin", value="admin"),
        app_commands.Choice(name="Owner", value="owner"),
    ])
    async def addstaff(self, interaction: discord.Interaction, user: discord.Member, role: str):
        actor_id = str(interaction.user.id)
        actor_is_dev = is_dev(interaction.user.id)

        if not self._is_owner_or_dev(actor_id):
            return await interaction.response.send_message("⛔ Only the owner or developer can invite staff.", ephemeral=True)

        if role == 'owner' and not actor_is_dev:
            return await interaction.response.send_message("⛔ Only the developer can invite an owner.", ephemeral=True)

        existing = next((s for s in self.staff if s.get('discord_id') == str(user.id)), None)
        if existing:
            existing['role'] = role
            existing['invite_only'] = True
            existing['updated_by'] = actor_id
            existing['updated_at'] = datetime.utcnow().isoformat()
            existing['username'] = existing.get('username') or user.name.lower().replace(' ', '_')
        else:
            self.staff.append({
                'id': f'staff_{int(datetime.now().timestamp() * 1000)}',
                'discord_id': str(user.id),
                'username': user.name.lower().replace(' ', '_'),
                'role': role,
                'invite_only': True,
                'added_by': actor_id,
                'added_at': datetime.utcnow().isoformat(),
            })

        if not self.save_staff():
            return await interaction.response.send_message("❌ Failed to save staff invite.", ephemeral=True)

        invite_link = self._make_admin_invite_link(user.id, role, interaction.user.id)

        embed = success_embed("Staff Invite Ready", f"{user.mention} has been invited as **{role}**.")
        embed.add_field(name="Signup Link", value=invite_link, inline=False)
        embed.add_field(name="How it works", value="They open the link, choose a username, and set their own password.", inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)

        try:
            dm = branded_embed("🛡️ TAROFINDS Admin Invite", "You've been invited to create your admin panel login.")
            dm.add_field(name="Role", value=role, inline=True)
            dm.add_field(name="Signup Link", value=invite_link, inline=False)
            dm.add_field(name="Next Step", value="Open the link and choose your own username and password.", inline=False)
            await user.send(embed=dm)
        except Exception:
            pass

    @app_commands.command(name="removestaff", description="Remove a staff member (owner/dev only)")
    @app_commands.describe(user="User to remove")
    async def removestaff(self, interaction: discord.Interaction, user: discord.Member):
        if not self._is_owner_or_dev(str(interaction.user.id)):
            return await interaction.response.send_message("⛔ Only the owner or developer can remove staff.", ephemeral=True)

        member = next((s for s in self.staff if s.get('discord_id') == str(user.id)), None)
        if not member:
            return await interaction.response.send_message("❌ This user is not staff.", ephemeral=True)
        if member.get('role') == 'owner' and not is_dev(interaction.user.id):
            return await interaction.response.send_message("⛔ Cannot remove owner unless you are the developer.", ephemeral=True)

        self.staff = [s for s in self.staff if s.get('discord_id') != str(user.id)]
        if self.save_staff():
            await interaction.response.send_message(embed=success_embed("Staff Removed", f"{user.mention} removed from staff."), ephemeral=True)
        else:
            await interaction.response.send_message("❌ Failed to save.", ephemeral=True)

    @app_commands.command(name="resetstaff", description="Reset bot staff records to Owner+Dev only (dev only)")
    async def resetstaff(self, interaction: discord.Interaction):
        if not is_dev(interaction.user.id):
            return await interaction.response.send_message("⛔ Developer only.", ephemeral=True)

        if os.path.exists(config.STAFF_FILE):
            os.remove(config.STAFF_FILE)
        self._load_staff()

        embed = success_embed("Staff Reset", "Bot staff records were reset. Only Owner and Dev remain in staff.json.")
        embed.add_field(name="Important", value="This does not remotely wipe old admin logins already stored in someone's browser. On a static site, browser-stored admin accounts cannot be force-cleared without a backend.", inline=False)
        embed.add_field(name="Next Step", value="Re-invite the staff you want with `/addstaff` so they create fresh admin logins.", inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="liststaff", description="List all staff members (owner/dev only)")
    async def liststaff(self, interaction: discord.Interaction):
        if not self._is_owner_or_dev(str(interaction.user.id)):
            return await interaction.response.send_message("⛔ Owner/dev only.", ephemeral=True)
        embed = branded_embed(f"👥 Staff ({len(self.staff)} members)", "")
        for s in self.staff:
            uid = s.get('discord_id', '?')
            embed.add_field(name=f"{s.get('username', '?')} [{s.get('role', '?')}]", value=f"Discord: <@{uid}> (`{uid}`)", inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="addcoupon", description="Add a coupon to the welcome popup (admin+)")
    @app_commands.describe(title="Popup title", code="Invite/coupon code", url="Registration URL", message="Popup message", button="Button label")
    @admin_or_higher()
    async def addcoupon(self, interaction: discord.Interaction, title: str, code: str,
                        url: str, message: str = "", button: str = "Register Now"):
        new_coupon = {
            'id': f'c_{int(datetime.now().timestamp() * 1000)}',
            'enabled': True,
            'title': title,
            'message': message,
            'code': code.upper(),
            'url': url if url.startswith('http') else '#',
            'button': button,
            'created_by': str(interaction.user.id),
            'created_at': datetime.now().isoformat()
        }
        self.coupons.append(new_coupon)
        if self.save_coupons():
            embed = success_embed("Coupon Added", f"**{title}** added to welcome popup.")
            embed.add_field(name="Code", value=f"`{code.upper()}`", inline=True)
            embed.add_field(name="URL", value=url, inline=False)
            await interaction.response.send_message(embed=embed, ephemeral=True)
        else:
            await interaction.response.send_message("❌ Failed to save coupon.", ephemeral=True)

    @app_commands.command(name="listcoupons", description="List all coupons (admin+)")
    @admin_or_higher()
    async def listcoupons(self, interaction: discord.Interaction):
        if not self.coupons:
            return await interaction.response.send_message("❌ No coupons.", ephemeral=True)
        embed = branded_embed(f"🎁 Coupons ({len(self.coupons)})", "")
        for c in self.coupons:
            status = "✅" if c.get('enabled') else "❌"
            embed.add_field(name=f"{status} {c.get('title', 'Untitled')}", value=f"Code: `{c.get('code', '—')}` · ID: `{c.get('id')}`", inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="deletecoupon", description="Delete a coupon by ID (admin+)")
    @app_commands.describe(coupon_id="Coupon ID from /listcoupons")
    @admin_or_higher()
    async def deletecoupon(self, interaction: discord.Interaction, coupon_id: str):
        coupon = next((c for c in self.coupons if c['id'] == coupon_id), None)
        if not coupon:
            return await interaction.response.send_message(f"❌ Coupon `{coupon_id}` not found.", ephemeral=True)
        self.coupons = [c for c in self.coupons if c['id'] != coupon_id]
        if self.save_coupons():
            await interaction.response.send_message(embed=success_embed("Coupon Deleted", f"**{coupon.get('title', '')}** removed."), ephemeral=True)
        else:
            await interaction.response.send_message("❌ Failed.", ephemeral=True)

    @app_commands.command(name="togglecoupon", description="Enable/disable a coupon (admin+)")
    @app_commands.describe(coupon_id="Coupon ID from /listcoupons")
    @admin_or_higher()
    async def togglecoupon(self, interaction: discord.Interaction, coupon_id: str):
        coupon = next((c for c in self.coupons if c['id'] == coupon_id), None)
        if not coupon:
            return await interaction.response.send_message(f"❌ Coupon `{coupon_id}` not found.", ephemeral=True)
        coupon['enabled'] = not coupon.get('enabled', True)
        status = "✅ enabled" if coupon['enabled'] else "❌ disabled"
        if self.save_coupons():
            await interaction.response.send_message(embed=success_embed("Coupon Updated", f"**{coupon.get('title', '')}** is now {status}."), ephemeral=True)
        else:
            await interaction.response.send_message("❌ Failed.", ephemeral=True)

    @app_commands.command(name="stats", description="Show site statistics (staff+)")
    @staff_or_higher()
    async def stats(self, interaction: discord.Interaction):
        embed = branded_embed("📊 Site Statistics", f"{config.BRAND_NAME} Database Stats")
        embed.add_field(name="📦 Products", value=str(len(self.products)), inline=True)
        embed.add_field(name="🏪 Sellers", value=str(len(self.sellers)), inline=True)
        embed.add_field(name="👥 Staff", value=str(len(self.staff)), inline=True)
        embed.add_field(name="🎁 Coupons", value=str(len(self.coupons)), inline=True)
        if self.products:
            cats = {}
            for p in self.products:
                c = p.get('category', '?')
                cats[c] = cats.get(c, 0) + 1
            top = max(cats.items(), key=lambda x: x[1])
            embed.add_field(name="🏷️ Top Category", value=f"{top[0]} ({top[1]})", inline=True)
        embed.set_footer(text=f"Last sync: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        file = setup_banner(embed)
        if file:
            await interaction.response.send_message(embed=embed, file=file, ephemeral=True)
        else:
            await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="sync", description="Reload all data from JSON files (owner/dev only)")
    async def sync(self, interaction: discord.Interaction):
        if not self._is_owner_or_dev(str(interaction.user.id)):
            return await interaction.response.send_message("⛔ Owner/dev only.", ephemeral=True)
        self.load_data()
        embed = success_embed("Sync Complete", "All data reloaded from JSON files.")
        embed.add_field(name="Products", value=str(len(self.products)), inline=True)
        embed.add_field(name="Sellers", value=str(len(self.sellers)), inline=True)
        embed.add_field(name="Staff", value=str(len(self.staff)), inline=True)
        embed.add_field(name="Coupons", value=str(len(self.coupons)), inline=True)
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot):
    await bot.add_cog(ManagementCog(bot))
