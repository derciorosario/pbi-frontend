import React from 'react';
import { MapPin, Users, Mail, Phone, Globe, Edit2, Share2, Plus, Briefcase, GraduationCap, Award } from 'lucide-react';

export default function ProfileCard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-500 rounded-t-2xl p-8 relative">
          <button className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
            <Edit2 size={16} />
            <span className="text-sm font-medium">Editar Capa</span>
          </button>
        </div>

        {/* Profile Info Section */}
        <div className="bg-white px-8 pb-6 relative">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"
                  alt="Amara Okafor"
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                />
                <button className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition">
                  <Edit2 size={14} />
                </button>
              </div>
              <div className="mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Amara Okafor</h1>
                <p className="text-gray-600 mt-1">Digital Marketing Specialist & Business Consultant</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    Lagos, Nigeria
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    2.4k conexões
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition font-medium">
                <Edit2 size={16} />
                Editar Perfil
              </button>
              <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg flex items-center gap-2 transition font-medium">
                <Share2 size={16} />
                Compartilhar
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Sobre */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Sobre</h2>
                <button className="text-purple-600 hover:text-purple-700">
                  <Edit2 size={18} />
                </button>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Especialista em marketing digital com mais de 8 anos de experiência ajudando empresas africanas a expandir globalmente. Apaixonada por conectar talentos e criar oportunidades de negócios entre países africanos.
              </p>
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">Marketing Digital</span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Consultoria</span>
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">E-commerce</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">SEO/SEM</span>
                </div>
              </div>
            </div>

            {/* Informações de Contato */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Informações de Contato</h2>
                <button className="text-purple-600 hover:text-purple-700">
                  <Edit2 size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Mail size={16} className="text-gray-400" />
                  <span>amara.okafor@email.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Phone size={16} className="text-gray-400" />
                  <span>+234 801 234 5678</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Briefcase size={16} className="text-gray-400" />
                  <span>linkedin.com/in/amaraokafor</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Globe size={16} className="text-gray-400" />
                  <span>amaraokafor.com</span>
                </div>
              </div>
            </div>

            {/* Idiomas */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Idiomas</h2>
                <button className="text-purple-600 hover:text-purple-700">
                  <Edit2 size={18} />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Inglês</span>
                  <span className="text-gray-500 text-sm">Nativo</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Português</span>
                  <span className="text-gray-500 text-sm">Fluente</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Francês</span>
                  <span className="text-gray-500 text-sm">Intermediário</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Swahili</span>
                  <span className="text-gray-500 text-sm">Básico</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Experiência Profissional */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Experiência Profissional</h2>
                <button className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm font-medium">
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg h-fit">
                    <Briefcase className="text-purple-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Senior Marketing Manager</h3>
                    <p className="text-green-600 font-medium text-sm">AfriTech Solutions</p>
                    <p className="text-gray-500 text-sm mt-1">Jan 2021 - Presente • 3 anos</p>
                    <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                      Liderando estratégias de marketing digital para expansão em 12 países africanos. Responsável por aumentar a base de clientes em 300% e gerar $2M em receita.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-green-100 p-3 rounded-lg h-fit">
                    <Briefcase className="text-green-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Digital Marketing Consultant</h3>
                    <p className="text-green-600 font-medium text-sm">Freelancer</p>
                    <p className="text-gray-500 text-sm mt-1">Mar 2018 - Dez 2020 • 2 anos 10 meses</p>
                    <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                      Consultoria para startups e PMEs em estratégias digitais, SEO e gestão de redes sociais. Mais de 50 projetos concluídos com sucesso.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formação Acadêmica */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Formação Acadêmica</h2>
                <button className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm font-medium">
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-yellow-100 p-3 rounded-lg h-fit">
                    <GraduationCap className="text-yellow-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">MBA em Marketing Digital</h3>
                    <p className="text-gray-700 text-sm">Lagos Business School</p>
                    <p className="text-gray-500 text-sm mt-1">2016 - 2018</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg h-fit">
                    <GraduationCap className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Bacharelado em Administração</h3>
                    <p className="text-gray-700 text-sm">University of Lagos</p>
                    <p className="text-gray-500 text-sm mt-1">2012 - 2016</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Habilidades */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Habilidades</h2>
                <button className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm font-medium">
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 text-sm font-medium">Marketing Digital</span>
                      <span className="text-gray-500 text-sm">95%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '95%'}}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 text-sm font-medium">Gestão de Projetos</span>
                      <span className="text-gray-500 text-sm">88%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '88%'}}></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 text-sm font-medium">SEO/SEM</span>
                      <span className="text-gray-500 text-sm">90%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '90%'}}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 text-sm font-medium">E-commerce</span>
                      <span className="text-gray-500 text-sm">82%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '82%'}}></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 text-sm font-medium">Analytics</span>
                      <span className="text-gray-500 text-sm">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 text-sm font-medium">Consultoria</span>
                      <span className="text-gray-500 text-sm">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '92%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificações */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Certificações</h2>
                <button className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm font-medium">
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded">
                      <Award className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Google Ads Certified</h3>
                      <p className="text-gray-500 text-sm mt-1">Google • 2023</p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded">
                      <Award className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Facebook Marketing</h3>
                      <p className="text-gray-500 text-sm mt-1">Meta • 2023</p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-100 p-2 rounded">
                      <Award className="text-orange-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Google Analytics</h3>
                      <p className="text-gray-500 text-sm mt-1">Google • 2022</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}